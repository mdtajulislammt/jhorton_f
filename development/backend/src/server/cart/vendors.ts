import { prisma } from '../db';
import { AssignmentSource } from '@prisma/client';
import { calculateDistanceMiles, getZipInfo } from '../dispensaries/distance';
import { getDispensaryHoursToday, isDeliveringNow, isOpenNow } from '../dispensaries/hours';
import { cartInclude, formatCartDto } from './index';
import { CartDetailDto, CartVendorDto, CartVendorWarningDto } from './types';

export interface GetCartVendorsOptions {
  zip?: string | null;
  lat?: number | null;
  lng?: number | null;
  shopperId?: string | null;
}

/**
 * Returns all ACTIVE dispensaries evaluated against the shopper's cart items.
 * If lat/lng or zip is provided, dispensaries are sorted by Haversine distance,
 * and the nearest is marked as isPreselected: true (and persisted as AUTO if none selected yet).
 * If no location, return unsorted with isPreselected: false (unless selected in cart).
 */
export async function getCartVendors(
  cartSessionToken: string,
  options: GetCartVendorsOptions = {}
): Promise<{
  vendors: CartVendorDto[];
  selectedDispensaryId: string | null;
  selectionSource: AssignmentSource | null;
}> {
  const cart = await prisma.cart.findUnique({
    where: { sessionToken: cartSessionToken },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!cart) {
    throw new Error('Cart not found');
  }

  // 1. Resolve user coordinates if lat/lng or zip provided
  let userLat: number | null =
    options.lat != null && !isNaN(Number(options.lat)) ? Number(options.lat) : null;
  let userLng: number | null =
    options.lng != null && !isNaN(Number(options.lng)) ? Number(options.lng) : null;

  if ((userLat == null || userLng == null) && options.zip) {
    const zipInfo = await getZipInfo(options.zip);
    if (zipInfo) {
      userLat = zipInfo.coordinates.latitude;
      userLng = zipInfo.coordinates.longitude;
    }
  }

  // 2. Fetch all ACTIVE dispensaries with hours (optionally hide UNREACHABLE vendors)
  const hideUnhealthy = process.env.HIDE_UNHEALTHY_VENDORS !== 'false';
  const dispensaryWhere: any = { isActive: true };
  if (hideUnhealthy) {
    dispensaryWhere.healthStatus = { not: 'UNREACHABLE' };
  }

  const dispensaries = await prisma.dispensary.findMany({
    where: dispensaryWhere,
    include: {
      hours: true,
    },
  });

  const productIds = cart.items.map((i) => i.productId);
  const totalCartItemCount = cart.items.length;

  // 3. Query product mappings for cart items across active dispensaries
  const mappings =
    productIds.length > 0
      ? await prisma.vendorProductMapping.findMany({
          where: {
            productId: { in: productIds },
            dispensaryId: { in: dispensaries.map((d) => d.id) },
            isAvailable: true,
          },
        })
      : [];

  const mappingsByDispensary = new Map<string, Set<string>>();
  for (const m of mappings) {
    if (!mappingsByDispensary.has(m.dispensaryId)) {
      mappingsByDispensary.set(m.dispensaryId, new Set());
    }
    mappingsByDispensary.get(m.dispensaryId)!.add(m.productId);
  }

  const now = new Date();

  // 4. Transform dispensaries into CartVendorDto
  const vendorDtos: CartVendorDto[] = dispensaries.map((d) => {
    let distanceMiles: number | null = null;
    if (userLat != null && userLng != null && d.latitude != null && d.longitude != null) {
      distanceMiles = calculateDistanceMiles(
        userLat,
        userLng,
        Number(d.latitude),
        Number(d.longitude)
      );
    }

    const isOpen = isOpenNow(d.hours as any, now);
    const isDelivering = d.offersDelivery ? isDeliveringNow(d.hours as any, now) : false;
    const hoursToday = getDispensaryHoursToday(d.hours as any, 'STORE' as any, now);
    const deliveryHoursToday = d.offersDelivery
      ? getDispensaryHoursToday(d.hours as any, 'DELIVERY' as any, now)
      : null;

    const mappedSet = mappingsByDispensary.get(d.id);
    const mappedItemCount = mappedSet ? mappedSet.size : 0;

    return {
      dispensaryId: d.id,
      name: d.name,
      slug: d.slug,
      address: d.addressLine1,
      city: d.city,
      zip: d.zip,
      distanceMiles,
      isOpenNow: isOpen,
      hoursToday: hoursToday
        ? { opensAt: hoursToday.opensAt, closesAt: hoursToday.closesAt }
        : null,
      offersDelivery: d.offersDelivery,
      isDeliveringNow: isDelivering,
      deliveryHoursToday: deliveryHoursToday
        ? { opensAt: deliveryHoursToday.opensAt, closesAt: deliveryHoursToday.closesAt }
        : null,
      mappedItemCount,
      totalCartItemCount,
      isPreselected: false,
    };
  });

  // 5. Handle sorting and preselection
  const hasCoordinates = userLat != null && userLng != null;
  if (hasCoordinates) {
    vendorDtos.sort((a, b) => {
      const distA = a.distanceMiles ?? Number.MAX_VALUE;
      const distB = b.distanceMiles ?? Number.MAX_VALUE;
      return distA - distB;
    });
  }

  let selectedDispensaryId = cart.selectedDispensaryId;
  let selectionSource = cart.selectionSource;

  // Logged-in shoppers: check default store as PROFILE_DEFAULT if not already SHOPPER_CHANGED
  if (!selectedDispensaryId && options.shopperId) {
    const shopper = await prisma.shopper.findUnique({
      where: { id: options.shopperId },
      select: { defaultDispensaryId: true },
    });
    if (shopper?.defaultDispensaryId) {
      const exists = vendorDtos.some((v) => v.dispensaryId === shopper.defaultDispensaryId);
      if (exists) {
        selectedDispensaryId = shopper.defaultDispensaryId;
        selectionSource = AssignmentSource.PROFILE_DEFAULT;
        await prisma.cart.update({
          where: { id: cart.id },
          data: {
            selectedDispensaryId,
            selectionSource,
          },
        });
      }
    }
  }

  // If still not selected and location given, auto-select nearest
  if (!selectedDispensaryId && hasCoordinates && vendorDtos.length > 0) {
    selectedDispensaryId = vendorDtos[0].dispensaryId;
    selectionSource = AssignmentSource.AUTO;
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        selectedDispensaryId,
        selectionSource,
      },
    });
  }

  // Set isPreselected flag on the active selection (or nearest if location provided)
  for (const v of vendorDtos) {
    if (selectedDispensaryId) {
      v.isPreselected = v.dispensaryId === selectedDispensaryId;
    } else if (hasCoordinates && v === vendorDtos[0]) {
      v.isPreselected = true;
    }
  }

  return {
    vendors: vendorDtos,
    selectedDispensaryId,
    selectionSource,
  };
}

/**
 * Sets the selected dispensary for a cart with SHOPPER_CHANGED source.
 */
export async function setCartVendor(
  cartSessionToken: string,
  dispensaryId: string,
  source: AssignmentSource = AssignmentSource.SHOPPER_CHANGED
): Promise<CartDetailDto> {
  const dispensary = await prisma.dispensary.findFirst({
    where: { id: dispensaryId, isActive: true },
  });

  if (!dispensary) {
    throw new Error('Dispensary not found or not active');
  }

  const updatedCart = await prisma.cart.update({
    where: { sessionToken: cartSessionToken },
    data: {
      selectedDispensaryId: dispensary.id,
      selectionSource: source,
      lastActivityAt: new Date(),
    },
    include: cartInclude,
  });

  return formatCartDto(updatedCart);
}

/**
 * Returns warnings for unmapped or unavailable cart items for a given dispensary.
 */
export async function getCartVendorWarnings(
  cartSessionToken: string,
  dispensaryId?: string | null
): Promise<CartVendorWarningDto[]> {
  const cart = await prisma.cart.findUnique({
    where: { sessionToken: cartSessionToken },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!cart) {
    throw new Error('Cart not found');
  }

  const targetDispensaryId = dispensaryId || cart.selectedDispensaryId;
  if (!targetDispensaryId) {
    return [];
  }

  const productIds = cart.items.map((i) => i.productId);
  if (productIds.length === 0) {
    return [];
  }

  const mappings = await prisma.vendorProductMapping.findMany({
    where: {
      productId: { in: productIds },
      dispensaryId: targetDispensaryId,
    },
  });

  const mappingMap = new Map(mappings.map((m) => [m.productId, m]));
  const warnings: CartVendorWarningDto[] = [];

  for (const item of cart.items) {
    const mapping = mappingMap.get(item.productId);
    if (!mapping) {
      warnings.push({
        cartItemId: item.id,
        productId: item.productId,
        productName: item.product.name,
        sku: item.product.sku,
        reason: 'UNMAPPED',
      });
    } else if (!mapping.isAvailable) {
      warnings.push({
        cartItemId: item.id,
        productId: item.productId,
        productName: item.product.name,
        sku: item.product.sku,
        reason: 'UNAVAILABLE',
      });
    }
  }

  return warnings;
}

