import { prisma } from '../db';
import { HandoffChannel, HoursKind } from '@prisma/client';

export class AdminDispensaryError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'AdminDispensaryError';
  }
}

export interface HourInput {
  kind: 'STORE' | 'DELIVERY';
  dayOfWeek: number; // 0=Sunday..6=Saturday
  opensAt: string; // "09:00"
  closesAt: string; // "21:00"
  isClosed?: boolean;
}

export interface CreateDispensaryInput {
  name: string;
  slug?: string;
  licenseNumber?: string | null;
  addressLine1: string;
  city: string;
  state?: string;
  zip: string;
  latitude?: number | null;
  longitude?: number | null;
  offersPickup?: boolean;
  offersDelivery?: boolean;
  coverageZips?: string[];
  timezone?: string;
  handoffChannel?: 'LEAFLY' | 'RETAILER_PAGE';
  handoffUrlTemplate?: string | null;
  leaflyStoreId?: string | null;
  webhookSecret?: string;
  isActive?: boolean;
  hours?: HourInput[];
}

export interface UpdateDispensaryInput extends Partial<CreateDispensaryInput> {}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function listAdminDispensaries() {
  const dispensaries = await prisma.dispensary.findMany({
    include: {
      hours: true,
      brands: {
        include: { brand: { select: { id: true, name: true, slug: true } } },
      },
      _count: {
        select: { inventory: true, subOrders: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return dispensaries.map((d) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    licenseNumber: d.licenseNumber,
    addressLine1: d.addressLine1,
    city: d.city,
    state: d.state,
    zip: d.zip,
    latitude: d.latitude ? Number(d.latitude) : null,
    longitude: d.longitude ? Number(d.longitude) : null,
    offersPickup: d.offersPickup,
    offersDelivery: d.offersDelivery,
    coverageZips: d.coverageZips,
    timezone: d.timezone,
    handoffChannel: d.handoffChannel,
    handoffUrlTemplate: d.handoffUrlTemplate,
    leaflyStoreId: d.leaflyStoreId,
    webhookSecret: d.webhookSecret,
    isActive: d.isActive,
    inventoryCount: d._count.inventory,
    subOrdersCount: d._count.subOrders,
    hoursCount: d.hours.length,
    brands: d.brands.map((b) => b.brand),
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }));
}

export async function getAdminDispensaryById(id: string) {
  const d = await prisma.dispensary.findUnique({
    where: { id },
    include: {
      hours: {
        orderBy: [{ kind: 'asc' }, { dayOfWeek: 'asc' }],
      },
      brands: {
        include: { brand: true },
      },
      _count: {
        select: { inventory: true, subOrders: true },
      },
    },
  });

  if (!d) {
    throw new AdminDispensaryError('NOT_FOUND', 'Dispensary not found', 404);
  }

  return {
    id: d.id,
    name: d.name,
    slug: d.slug,
    licenseNumber: d.licenseNumber,
    addressLine1: d.addressLine1,
    city: d.city,
    state: d.state,
    zip: d.zip,
    latitude: d.latitude ? Number(d.latitude) : null,
    longitude: d.longitude ? Number(d.longitude) : null,
    offersPickup: d.offersPickup,
    offersDelivery: d.offersDelivery,
    coverageZips: d.coverageZips,
    timezone: d.timezone,
    handoffChannel: d.handoffChannel,
    handoffUrlTemplate: d.handoffUrlTemplate,
    leaflyStoreId: d.leaflyStoreId,
    webhookSecret: d.webhookSecret,
    isActive: d.isActive,
    hours: d.hours.map((h) => ({
      id: h.id,
      kind: h.kind,
      dayOfWeek: h.dayOfWeek,
      opensAt: h.opensAt,
      closesAt: h.closesAt,
      isClosed: h.isClosed,
    })),
    brands: d.brands.map((b) => b.brand),
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

export async function createAdminDispensary(data: CreateDispensaryInput) {
  if (!data.name || !data.addressLine1 || !data.city || !data.zip) {
    throw new AdminDispensaryError(
      'VALIDATION_ERROR',
      'Name, addressLine1, city, and zip are required',
      400
    );
  }

  const slug = data.slug ? slugify(data.slug) : slugify(data.name);

  const existing = await prisma.dispensary.findUnique({ where: { slug } });
  if (existing) {
    throw new AdminDispensaryError('SLUG_TAKEN', `Dispensary with slug "${slug}" already exists`, 409);
  }

  const webhookSecret =
    data.webhookSecret || `whsec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

  // Default hours if not provided: 7 days STORE (09:00-21:00) and 7 days DELIVERY (10:00-20:00)
  const defaultHours: HourInput[] = [];
  if (!data.hours || data.hours.length === 0) {
    for (let day = 0; day < 7; day++) {
      defaultHours.push({
        kind: 'STORE',
        dayOfWeek: day,
        opensAt: '09:00',
        closesAt: '21:00',
        isClosed: false,
      });
      defaultHours.push({
        kind: 'DELIVERY',
        dayOfWeek: day,
        opensAt: '10:00',
        closesAt: '20:00',
        isClosed: false,
      });
    }
  }

  const hoursToCreate = data.hours && data.hours.length > 0 ? data.hours : defaultHours;

  const dispensary = await prisma.dispensary.create({
    data: {
      name: data.name,
      slug,
      licenseNumber: data.licenseNumber ?? null,
      addressLine1: data.addressLine1,
      city: data.city,
      state: data.state || 'NY',
      zip: data.zip,
      latitude: data.latitude !== undefined && data.latitude !== null ? data.latitude : null,
      longitude: data.longitude !== undefined && data.longitude !== null ? data.longitude : null,
      offersPickup: data.offersPickup ?? true,
      offersDelivery: data.offersDelivery ?? false,
      coverageZips: data.coverageZips || [data.zip],
      timezone: data.timezone || 'America/New_York',
      handoffChannel: (data.handoffChannel as HandoffChannel) || 'RETAILER_PAGE',
      handoffUrlTemplate: data.handoffUrlTemplate ?? null,
      leaflyStoreId: data.leaflyStoreId ?? null,
      webhookSecret,
      isActive: data.isActive ?? true,
      hours: {
        create: hoursToCreate.map((h) => ({
          kind: h.kind as HoursKind,
          dayOfWeek: h.dayOfWeek,
          opensAt: h.opensAt,
          closesAt: h.closesAt,
          isClosed: h.isClosed ?? false,
        })),
      },
    },
    include: {
      hours: true,
    },
  });

  return dispensary;
}

export async function updateAdminDispensary(id: string, data: UpdateDispensaryInput) {
  const existing = await prisma.dispensary.findUnique({ where: { id } });
  if (!existing) {
    throw new AdminDispensaryError('NOT_FOUND', 'Dispensary not found', 404);
  }

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.slug !== undefined) updateData.slug = slugify(data.slug);
  if (data.licenseNumber !== undefined) updateData.licenseNumber = data.licenseNumber;
  if (data.addressLine1 !== undefined) updateData.addressLine1 = data.addressLine1;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.state !== undefined) updateData.state = data.state;
  if (data.zip !== undefined) updateData.zip = data.zip;
  if (data.latitude !== undefined) updateData.latitude = data.latitude;
  if (data.longitude !== undefined) updateData.longitude = data.longitude;
  if (data.offersPickup !== undefined) updateData.offersPickup = data.offersPickup;
  if (data.offersDelivery !== undefined) updateData.offersDelivery = data.offersDelivery;
  if (data.coverageZips !== undefined) updateData.coverageZips = data.coverageZips;
  if (data.timezone !== undefined) updateData.timezone = data.timezone;
  if (data.handoffChannel !== undefined) updateData.handoffChannel = data.handoffChannel;
  if (data.handoffUrlTemplate !== undefined) updateData.handoffUrlTemplate = data.handoffUrlTemplate;
  if (data.leaflyStoreId !== undefined) updateData.leaflyStoreId = data.leaflyStoreId;
  if (data.webhookSecret !== undefined) updateData.webhookSecret = data.webhookSecret;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  // Run update inside transaction if hours are also modified
  const result = await prisma.$transaction(async (tx) => {
    if (data.hours && Array.isArray(data.hours)) {
      for (const h of data.hours) {
        await tx.dispensaryHours.upsert({
          where: {
            dispensaryId_kind_dayOfWeek: {
              dispensaryId: id,
              kind: h.kind as HoursKind,
              dayOfWeek: h.dayOfWeek,
            },
          },
          create: {
            dispensaryId: id,
            kind: h.kind as HoursKind,
            dayOfWeek: h.dayOfWeek,
            opensAt: h.opensAt,
            closesAt: h.closesAt,
            isClosed: h.isClosed ?? false,
          },
          update: {
            opensAt: h.opensAt,
            closesAt: h.closesAt,
            isClosed: h.isClosed ?? false,
          },
        });
      }
    }

    return tx.dispensary.update({
      where: { id },
      data: updateData,
      include: {
        hours: true,
      },
    });
  });

  return result;
}

