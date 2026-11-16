import { prisma } from '../db';

export class AdminBrandError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'AdminBrandError';
  }
}

export interface CreateBrandInput {
  name: string;
  slug?: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  dispensaryIds?: string[];
}

export interface UpdateBrandInput extends Partial<CreateBrandInput> {}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function listAdminBrands() {
  const brands = await prisma.brand.findMany({
    include: {
      dispensaries: {
        include: {
          dispensary: {
            select: { id: true, name: true, slug: true, zip: true, offersPickup: true, offersDelivery: true },
          },
        },
      },
      _count: {
        select: { products: true, liveShows: true },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  return brands.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    description: b.description,
    logoUrl: b.logoUrl,
    bannerUrl: b.bannerUrl,
    isActive: b.isActive,
    sortOrder: b.sortOrder,
    productsCount: b._count.products,
    showsCount: b._count.liveShows,
    dispensariesCount: b.dispensaries.length,
    dispensaries: b.dispensaries.map((d) => d.dispensary),
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }));
}

export async function getAdminBrandById(id: string) {
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: {
      dispensaries: {
        include: {
          dispensary: true,
        },
      },
      products: {
        select: { id: true, name: true, slug: true, owtletPrice: true, isActive: true },
      },
      liveShows: {
        select: { id: true, title: true, status: true },
      },
    },
  });

  if (!brand) {
    throw new AdminBrandError('NOT_FOUND', 'Brand not found', 404);
  }

  return {
    ...brand,
    dispensaries: brand.dispensaries.map((d) => d.dispensary),
    createdAt: brand.createdAt.toISOString(),
    updatedAt: brand.updatedAt.toISOString(),
  };
}

export async function createAdminBrand(data: CreateBrandInput) {
  if (!data.name) {
    throw new AdminBrandError('VALIDATION_ERROR', 'Brand name is required', 400);
  }

  const slug = data.slug ? slugify(data.slug) : slugify(data.name);

  const existing = await prisma.brand.findUnique({ where: { slug } });
  if (existing) {
    throw new AdminBrandError('SLUG_TAKEN', `Brand with slug "${slug}" already exists`, 409);
  }

  const dispensaryIds = data.dispensaryIds || [];

  // Acceptance Criteria AC-BRD-01: Block activation with 0 stores
  if (data.isActive && dispensaryIds.length === 0) {
    throw new AdminBrandError(
      'DISPENSARY_REQUIRED',
      'Brand cannot be activated without at least one assigned partner dispensary (AC-BRD-01)',
      422
    );
  }

  const brand = await prisma.brand.create({
    data: {
      name: data.name,
      slug,
      description: data.description ?? null,
      logoUrl: data.logoUrl ?? null,
      bannerUrl: data.bannerUrl ?? null,
      isActive: data.isActive ?? (dispensaryIds.length > 0),
      sortOrder: data.sortOrder ?? 0,
      dispensaries: {
        create: dispensaryIds.map((dispensaryId) => ({
          dispensary: { connect: { id: dispensaryId } },
        })),
      },
    },
    include: {
      dispensaries: {
        include: { dispensary: true },
      },
    },
  });

  return {
    ...brand,
    dispensaries: brand.dispensaries.map((d) => d.dispensary),
  };
}

export async function updateAdminBrand(id: string, data: UpdateBrandInput) {
  const existing = await prisma.brand.findUnique({
    where: { id },
    include: { dispensaries: true },
  });

  if (!existing) {
    throw new AdminBrandError('NOT_FOUND', 'Brand not found', 404);
  }

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.slug !== undefined) updateData.slug = slugify(data.slug);
  if (data.description !== undefined) updateData.description = data.description;
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
  if (data.bannerUrl !== undefined) updateData.bannerUrl = data.bannerUrl;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  // Acceptance Criteria AC-BRD-01: Block activation with 0 stores
  if (data.isActive === true) {
    const hasDispensaries = existing.dispensaries.length > 0;
    if (!hasDispensaries) {
      throw new AdminBrandError(
        'DISPENSARY_REQUIRED',
        'Brand cannot be activated without at least one assigned partner dispensary (AC-BRD-01)',
        422
      );
    }
    updateData.isActive = true;
  } else if (data.isActive === false) {
    updateData.isActive = false;
  }

  const updated = await prisma.brand.update({
    where: { id },
    data: updateData,
    include: {
      dispensaries: {
        include: { dispensary: true },
      },
    },
  });

  return {
    ...updated,
    dispensaries: updated.dispensaries.map((d) => d.dispensary),
  };
}

export async function assignBrandDispensaries(brandId: string, dispensaryIds: string[]) {
  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand) {
    throw new AdminBrandError('NOT_FOUND', 'Brand not found', 404);
  }

  // If brand is active and attempting to remove all dispensaries, block with 422
  if (brand.isActive && (!dispensaryIds || dispensaryIds.length === 0)) {
    throw new AdminBrandError(
      'DISPENSARY_REQUIRED',
      'Cannot remove all dispensaries from an active brand; deactivate brand first or assign at least one dispensary (AC-BRD-01)',
      422
    );
  }

  await prisma.$transaction(async (tx) => {
    // Delete existing mappings
    await tx.brandDispensary.deleteMany({
      where: { brandId },
    });

    // Create new mappings
    if (dispensaryIds.length > 0) {
      await tx.brandDispensary.createMany({
        data: dispensaryIds.map((dispensaryId) => ({
          brandId,
          dispensaryId,
        })),
      });
    }
  });

  return getAdminBrandById(brandId);
}

