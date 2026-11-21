import crypto from 'crypto';
import { FulfillmentType, AssignmentSource, Prisma, HandoffChannel } from '@prisma/client';
import { prisma } from '../db';
import { calculateDistanceMiles, getZipInfo } from '../dispensaries/distance';
import { getDispensaryHoursToday, isDeliveringNow, isOpenNow } from '../dispensaries/hours';
import { NoCoverageError } from '../dispensaries/types';
import { calculateCartExpiration, isCartExpired } from '../cart/expiry';
import { CartExpiredError } from '../cart';
import { formatMoney, PriceMode } from '../pricing';
import {
  DistributionResult,
  AllocatedSubOrder,
  AllocatedOrderItem,
  UnfulfillableLine,
} from './types';

export interface CreateDistributionPreviewOptions {
  cartId?: string;
  cartSessionToken?: string;
  fulfillmentType: FulfillmentType;
  zip?: string | null;
  excludeProductIds?: string[];
  preferredDispensaryId?: string | null;
  now?: Date;
}

/**
 * Creates distribution preview for ONE selected dispensary.
 * All cart items are fulfilled by the single selected dispensary.
 */
export async function createDistributionPreview(
  options: CreateDistributionPreviewOptions
): Promise<DistributionResult> {
  const {
    cartId,
    cartSessionToken,
    fulfillmentType,
    preferredDispensaryId = null,
    excludeProductIds = [],
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
          product: {
            include: {
              inventory: true,
            },
          },
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

  // 3. Resolve target dispensary
  const targetDispensaryId = preferredDispensaryId || cart.selectedDispensaryId;

  // Fetch active dispensaries
  const dispensaries = await prisma.dispensary.findMany({
    where: { isActive: true },
    include: { hours: true },
  });

  let selectedDispensary = targetDispensaryId
    ? dispensaries.find((d) => d.id === targetDispensaryId)
    : null;

  // If none selected yet, auto-select nearest if location known, else first active
  if (!selectedDispensary && dispensaries.length > 0) {
    if (zipInfo?.coordinates) {
      dispensaries.sort((a, b) => {
        const distA =
          a.latitude && a.longitude
            ? calculateDistanceMiles(
                zipInfo.coordinates.latitude,
                zipInfo.coordinates.longitude,
                Number(a.latitude),
                Number(a.longitude)
              )
            : Number.MAX_VALUE;
        const distB =
          b.latitude && b.longitude
            ? calculateDistanceMiles(
                zipInfo.coordinates.latitude,
                zipInfo.coordinates.longitude,
                Number(b.latitude),
                Number(b.longitude)
              )
            : Number.MAX_VALUE;
        return distA - distB;
      });
    }
    selectedDispensary = dispensaries[0];
  }

  if (!selectedDispensary) {
    return {
      zip: cleanZip,
      fulfillmentType,
      subOrders: [],
      unfulfillable: cart.items.map((i) => ({
        productId: i.productId,
        name: i.product.name,
        reason: 'NO_ELIGIBLE_STORES',
        suggestions: [],
      })),
      total: '0.00',
      previewHash: 'none',
    };
  }

  // 4. Calculate Distance and Hours for Selected Dispensary
  let distanceMiles: number | null = null;
  if (zipInfo?.coordinates && selectedDispensary.latitude && selectedDispensary.longitude) {
    distanceMiles = calculateDistanceMiles(
      zipInfo.coordinates.latitude,
      zipInfo.coordinates.longitude,
      Number(selectedDispensary.latitude),
      Number(selectedDispensary.longitude)
    );
  }

  const timeZone = selectedDispensary.timezone || 'America/New_York';
  const storeOpen = isOpenNow(selectedDispensary.hours as any, now, timeZone);
  const storeHours = getDispensaryHoursToday(selectedDispensary.hours as any, 'STORE' as any, now, timeZone);
  const deliveryOpen = selectedDispensary.offersDelivery
    ? isDeliveringNow(selectedDispensary.hours as any, now, timeZone)
    : false;
  const deliveryHours = selectedDispensary.offersDelivery
    ? getDispensaryHoursToday(selectedDispensary.hours as any, 'DELIVERY' as any, now, timeZone)
    : null;

  // 5. Query VendorProductMapping for selected dispensary
  const productIds = cart.items.map((i) => i.productId);
  const mappings = await prisma.vendorProductMapping.findMany({
    where: {
      productId: { in: productIds },
      dispensaryId: selectedDispensary.id,
    },
  });

  const mappingMap = new Map(mappings.map((m) => [m.productId, m]));

  const orderItems: AllocatedOrderItem[] = [];
  const unfulfillable: UnfulfillableLine[] = [];
  let totalNum = 0;

  const effectiveHandoffChannel =
    selectedDispensary.handoffChannel === HandoffChannel.ORDER_REQUEST
      ? HandoffChannel.ORDER_REQUEST
      : selectedDispensary.platform === 'WOOCOMMERCE'
      ? HandoffChannel.WOOCOMMERCE
      : selectedDispensary.platform === 'SHOPIFY'
      ? HandoffChannel.SHOPIFY
      : selectedDispensary.platform === 'BIGCOMMERCE'
      ? HandoffChannel.BIGCOMMERCE
      : HandoffChannel.DEEP_LINK;

  for (const item of cart.items) {
    // If excluded by shopper, leave out of SubOrder and preview calculations
    if (excludeProductIds.includes(item.productId)) {
      continue;
    }

    const product = item.product;
    const mapping = mappingMap.get(item.productId);

    // Calculate line price
    let unitPrice: string;
    let priceMode: PriceMode;

    if (product.owtletPrice != null) {
      priceMode = 'OWTLET';
      unitPrice = formatMoney(product.owtletPrice);
    } else {
      priceMode = 'PER_STORE';
      const storeInv = product.inventory.find(
        (inv) => inv.dispensaryId === selectedDispensary!.id
      );
      unitPrice = storeInv ? formatMoney(storeInv.price) : '0.00';
    }

    const lineTotalNum = Number(unitPrice) * item.quantity;
    totalNum += lineTotalNum;

    orderItems.push({
      productId: item.productId,
      name: product.name,
      quantity: item.quantity,
      unitPrice,
      priceMode,
      lineTotal: lineTotalNum.toFixed(2),
    });

    // Check if unfulfillable / unmapped
    // If items are unmapped and dispensary channel is DEEP_LINK, allow the order (items listed for manual add)
    // Only flag unfulfillable if not DEEP_LINK
    if (!mapping || !mapping.isAvailable) {
      if (effectiveHandoffChannel !== HandoffChannel.DEEP_LINK) {
        unfulfillable.push({
          productId: item.productId,
          name: product.name,
          reason: 'NOT_AT_SELECTED_STORE',
          suggestions: [],
        });
      }
    }
  }

  const subOrder: AllocatedSubOrder = {
    dispensaryId: selectedDispensary.id,
    dispensaryName: selectedDispensary.name,
    fulfillmentType,
    assignment: cart.selectionSource || AssignmentSource.AUTO,
    channelBrandId: null,
    channelBrand: null,
    isOpenNow: storeOpen,
    hoursToday: storeHours ? { opensAt: storeHours.opensAt, closesAt: storeHours.closesAt } : null,
    isDeliveringNow: deliveryOpen,
    deliveryHoursToday: deliveryHours ? { opensAt: deliveryHours.opensAt, closesAt: deliveryHours.closesAt } : null,
    distanceMiles,
    items: orderItems,
    subtotal: totalNum.toFixed(2),
    handoffChannel: effectiveHandoffChannel,
    alternatives: [],
  };

  const previewHashPayload = JSON.stringify({
    dispensaryId: selectedDispensary.id,
    total: totalNum.toFixed(2),
    items: orderItems.map((i) => ({ p: i.productId, q: i.quantity, pr: i.unitPrice })),
    fulfillmentType,
    zip: cleanZip,
  });

  const previewHash = crypto.createHash('sha256').update(previewHashPayload).digest('hex').slice(0, 16);

  return {
    zip: cleanZip,
    fulfillmentType,
    subOrders: [subOrder],
    unfulfillable,
    total: totalNum.toFixed(2),
    previewHash,
  };
}
