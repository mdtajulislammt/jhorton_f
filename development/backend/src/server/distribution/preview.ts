import { FulfillmentType, AssignmentSource, Prisma } from '@prisma/client';
import { prisma } from '../db';
import { calculateDistanceMiles, getZipInfo } from '../dispensaries/distance';
import { getDispensaryHoursToday, isDeliveringNow, isOpenNow } from '../dispensaries/hours';
import { NoCoverageError } from '../dispensaries/types';
import { calculateCartExpiration, isCartExpired } from '../cart/expiry';
import { CartExpiredError } from '../cart';
import { allocateCart } from './allocate';
import {
  AllocatorCartLine,
  AllocatorDispensaryCandidate,
  AllocatorInventoryItem,
  DistributionResult,
  ItemOverride,
} from './types';

export interface CreateDistributionPreviewOptions {
  cartId?: string;
  cartSessionToken?: string;
  fulfillmentType: FulfillmentType;
  zip?: string | null;
  itemOverrides?: ItemOverride[];
  preferredDispensaryId?: string | null;
  preferredDispensarySource?: AssignmentSource;
  now?: Date;
}

/**
 * Loads cart and inventory from database and computes distribution preview.
 * (docs/06 §4, docs/08 §8.1)
 */
export async function createDistributionPreview(
  options: CreateDistributionPreviewOptions
): Promise<DistributionResult> {
  const {
    cartId,
    cartSessionToken,
    fulfillmentType,
    itemOverrides = [],
    preferredDispensaryId = null,
    preferredDispensarySource = AssignmentSource.SHOPPER_CHANGED,
    now = new Date(),
  } = options;

  const cleanZip = options.zip ? options.zip.trim() : null;

  // 1. DELIVERY Validation & Coverage Gate
  if (fulfillmentType === FulfillmentType.DELIVERY) {
    if (!cleanZip) {
      throw new Error('ZIP code is required for DELIVERY fulfillment');
    }
    const zipInfo = await getZipInfo(cleanZip);
    if (!zipInfo) {
      throw new NoCoverageError(cleanZip);
    }
  }

  // Centroid lookup for distance calculation
  const zipInfo = cleanZip ? await getZipInfo(cleanZip) : null;

  // 2. Load Cart
  const cartWhere: Prisma.CartWhereInput = {};
  if (cartId) {
    cartWhere.id = cartId;
  } else if (cartSessionToken) {
    cartWhere.sessionToken = cartSessionToken;
  } else {
    throw new Error('cartId or cartSessionToken must be provided');
  }

  const cart = await prisma.cart.findFirst({
    where: cartWhere,
    include: {
      items: {
        include: {
          product: true,
          channelBrand: true,
        },
        orderBy: { createdAt: 'asc' },
      },
      liveShow: true,
    },
  });

  if (!cart) {
    throw new Error('Cart not found');
  }

  // Check expiration
  const { expiresAt } = calculateCartExpiration(
    { lastActivityAt: cart.lastActivityAt, liveShowId: cart.liveShowId },
    cart.liveShow,
    now
  );

  if (isCartExpired({ expiresAt, status: cart.status }, now)) {
    throw new CartExpiredError();
  }

  // 3. Prepare Cart Lines for Allocator
  const lines: AllocatorCartLine[] = cart.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    name: item.product.name,
    quantity: item.quantity,
    channelBrandId: item.channelBrandId,
    preferredDispensaryId: item.preferredDispensaryId,
    owtletPrice:
      item.product.owtletPrice !== null && item.product.owtletPrice !== undefined
        ? Number(item.product.owtletPrice)
        : null,
  }));

  const productIds = Array.from(new Set(lines.map((l) => l.productId)));

  // 4. Fetch All Active Dispensaries
  const dispensaries = await prisma.dispensary.findMany({
    where: { isActive: true },
    include: {
      hours: true,
      brands: true,
    },
  });

  // 5. Fetch Inventory for Cart Products Across All Active Dispensaries
  const inventories = await prisma.inventory.findMany({
    where: {
      productId: { in: productIds },
    },
  });

  // Group inventories by dispensaryId -> Map<productId, inventory>
  const inventoryByDisp = new Map<string, Map<string, AllocatorInventoryItem>>();
  for (const inv of inventories) {
    let dispMap = inventoryByDisp.get(inv.dispensaryId);
    if (!dispMap) {
      dispMap = new Map();
      inventoryByDisp.set(inv.dispensaryId, dispMap);
    }
    dispMap.set(inv.productId, {
      productId: inv.productId,
      dispensaryId: inv.dispensaryId,
      stockQty: inv.stockQty,
      price: inv.price !== null ? Number(inv.price) : null,
    });
  }

  // 6. Build Candidate Dispensaries
  const candidates: AllocatorDispensaryCandidate[] = dispensaries.map((disp) => {
    let distanceMiles: number | null = null;
    if (zipInfo?.coordinates && disp.latitude && disp.longitude) {
      distanceMiles = calculateDistanceMiles(
        zipInfo.coordinates.latitude,
        zipInfo.coordinates.longitude,
        Number(disp.latitude),
        Number(disp.longitude)
      );
    }

    const timeZone = disp.timezone || 'America/New_York';
    const storeOpen = isOpenNow(disp.hours, now, timeZone);
    const storeHours = getDispensaryHoursToday(disp.hours, 'STORE', now, timeZone);
    const deliveryOpen = disp.offersDelivery
      ? isDeliveringNow(disp.hours, now, timeZone)
      : false;
    const deliveryHours = disp.offersDelivery
      ? getDispensaryHoursToday(disp.hours, 'DELIVERY', now, timeZone)
      : null;

    const brandIds = disp.brands.map((b) => b.brandId);
    const invMap = inventoryByDisp.get(disp.id) || new Map();

    return {
      id: disp.id,
      name: disp.name,
      slug: disp.slug,
      offersPickup: disp.offersPickup,
      offersDelivery: disp.offersDelivery,
      coverageZips: disp.coverageZips,
      isOpenNow: storeOpen,
      hoursToday: storeHours,
      isDeliveringNow: deliveryOpen,
      deliveryHoursToday: deliveryHours,
      distanceMiles,
      handoffChannel: disp.handoffChannel,
      brandIds,
      inventories: invMap,
    };
  });

  // 7. Run Pure Allocator
  const allocation = allocateCart({
    lines,
    fulfillmentType,
    zip: cleanZip,
    itemOverrides,
    preferredDispensaryId,
    preferredDispensarySource,
    now,
    candidates,
    allActiveDispensaries: candidates,
  });

  // 8. Hydrate brand information on subOrders if channelBrandId exists
  if (allocation.subOrders.some((so) => so.channelBrandId)) {
    const brandIdsToFetch = Array.from(
      new Set(
        allocation.subOrders
          .map((so) => so.channelBrandId)
          .filter((id): id is string => Boolean(id))
      )
    );

    const brands = await prisma.brand.findMany({
      where: { id: { in: brandIdsToFetch } },
      select: { id: true, name: true, slug: true },
    });

    const brandMap = new Map(brands.map((b) => [b.id, b]));
    for (const subOrder of allocation.subOrders) {
      if (subOrder.channelBrandId) {
        subOrder.channelBrand = brandMap.get(subOrder.channelBrandId) || null;
      }
    }
  }

  return allocation;
}
