import { HandoffChannel, SubOrderStatus, CartStatus } from '@prisma/client';
import { prisma } from '../db';
import { rollupOrderStatus } from '../orders/status';
import {
  buildWooCommerceUrl,
  buildShopifyUrl,
  buildBigCommerceUrl,
  buildDeepLinkUrl,
  sendOrderRequest,
  AdapterLineInput,
  AdapterVendorInput,
  AdapterResult,
} from './adapters';
import {
  ForbiddenOrderAccessError,
  OrderNotFoundError,
  SubOrderNotFoundError,
  HandoffError,
} from './types';

export { verifySignedPayload, createSignedPayload } from './signed-payload';
export * from './types';

/**
 * Validates that the URL host is in the dispensary's allowedHosts list.
 * Prevents open redirects (CWE-601).
 */
export function validateHandoffHost(urlStr: string, allowedHosts: string[]): boolean {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();
    return allowedHosts.some((allowed) => {
      const cleanAllowed = allowed.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      return host === cleanAllowed || host.endsWith(`.${cleanAllowed}`);
    });
  } catch {
    return false;
  }
}

/**
 * Appends standard UTM tracking parameters to the handoff URL.
 */
export function appendUtmParameters(urlStr: string, orderNumber: string): string {
  const url = new URL(urlStr);
  url.searchParams.set('utm_source', 'owtlet');
  url.searchParams.set('utm_medium', 'referral');
  url.searchParams.set('utm_campaign', 'cart_handoff');
  url.searchParams.set('utm_content', orderNumber);
  return url.toString();
}

/**
 * Builds the vendor handoff URL using the appropriate platform adapter.
 */
export async function buildVendorHandoffUrl(
  channel: HandoffChannel,
  vendor: AdapterVendorInput,
  lines: AdapterLineInput[],
  context: { orderId?: string; orderNumber: string; subOrderId: string; storefront?: boolean }
): Promise<AdapterResult> {
  switch (channel) {
    case HandoffChannel.WOOCOMMERCE:
      return buildWooCommerceUrl(vendor, lines, context);
    case HandoffChannel.SHOPIFY:
      return buildShopifyUrl(vendor, lines, context);
    case HandoffChannel.BIGCOMMERCE:
      return buildBigCommerceUrl(vendor, lines, context);
    case HandoffChannel.ORDER_REQUEST:
      return sendOrderRequest(vendor, lines, context);
    case HandoffChannel.DEEP_LINK:
    default:
      return buildDeepLinkUrl(vendor, lines, context);
  }
}

/**
 * Generates the redirect URL for a specific order and marks it HANDED_OFF.
 * Marks the cart as CONVERTED (if CLEAR_CART_AFTER_HANDOFF is true, default true).
 */
export async function generateHandoffRedirect(options: {
  orderId: string;
  subOrderId?: string;
  session?: {
    cartSessionToken?: string | null;
    shopperId?: string | null;
    isAdmin?: boolean;
  };
}): Promise<{ redirectUrl: string; orderNumber: string; warnings?: string[] }> {
  const { orderId, subOrderId, session = {} } = options;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      cart: true,
      subOrders: {
        include: {
          dispensary: {
            include: {
              vendorMappings: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!order) {
    throw new OrderNotFoundError(`Order with ID ${orderId} not found`);
  }

  // Authorization check
  const isAuthorized =
    session.isAdmin ||
    (session.shopperId && order.shopperId === session.shopperId) ||
    (session.cartSessionToken &&
      order.cart &&
      order.cart.sessionToken === session.cartSessionToken);

  if (!isAuthorized) {
    throw new ForbiddenOrderAccessError('You do not have permission to hand off this order');
  }

  // Target sub-order (single-vendor checkout = 1 SubOrder)
  const targetSubOrder = subOrderId
    ? order.subOrders.find((s) => s.id === subOrderId)
    : order.subOrders[0];

  if (!targetSubOrder) {
    throw new SubOrderNotFoundError(`No sub-order found for order ${orderId}`);
  }

  const dispensary = targetSubOrder.dispensary;
  const channel = targetSubOrder.handoffChannel || dispensary.handoffChannel || HandoffChannel.DEEP_LINK;

  // Build mapped lines
  const mappingMap = new Map(dispensary.vendorMappings.map((m) => [m.productId, m]));
  const lines: AdapterLineInput[] = targetSubOrder.items.map((item) => {
    const mapping = mappingMap.get(item.productId);
    return {
      productId: item.productId,
      sku: item.product?.sku || item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.unitPrice ? String(item.unitPrice) : null,
      vendorProductId: mapping?.vendorProductId || null,
      vendorVariantId: mapping?.vendorVariantId || null,
      vendorSku: mapping?.vendorSku || null,
    };
  });

  const vendorInput: AdapterVendorInput = {
    id: dispensary.id,
    name: dispensary.name,
    slug: dispensary.slug,
    websiteUrl: dispensary.websiteUrl,
    cartBaseUrl: dispensary.cartBaseUrl,
    webhookSecret: dispensary.webhookSecret,
    allowedHosts: dispensary.allowedHosts,
    handoffNotes: dispensary.handoffNotes,
  };

  const adapterResult = await buildVendorHandoffUrl(channel, vendorInput, lines, {
    orderId: order.id,
    orderNumber: order.orderNumber,
    subOrderId: targetSubOrder.id,
    storefront: dispensary.shopifyStorefrontParam,
  });

  // Host Whitelist Validation (Prevent Open Redirect - Fail closed if allowedHosts is empty)
  if (channel === HandoffChannel.ORDER_REQUEST) {
    // ORDER_REQUEST returns internal route e.g. /order/[id]?requested=1
  } else {
    if (!dispensary.allowedHosts || dispensary.allowedHosts.length === 0) {
      throw new HandoffError('Dispensary allowedHosts whitelist is not configured', 'HOST_NOT_ALLOWED');
    }
    const isAllowed = validateHandoffHost(adapterResult.url, dispensary.allowedHosts);
    if (!isAllowed) {
      throw new HandoffError('Dispensary redirect host is not permitted by whitelist', 'HOST_NOT_ALLOWED');
    }
  }

  // Append standard UTM tracking parameters for external URLs
  const finalRedirectUrl = adapterResult.url.startsWith('http')
    ? appendUtmParameters(adapterResult.url, order.orderNumber)
    : adapterResult.url;

  // Transition sub-order and order status in a transaction
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.subOrder.update({
      where: { id: targetSubOrder.id },
      data: {
        status: SubOrderStatus.HANDED_OFF,
        handoffUrl: finalRedirectUrl,
        handoffWarnings: adapterResult.warnings ? (adapterResult.warnings as any) : undefined,
        handedOffAt: now,
      },
    });

    const currentSubOrders = await tx.subOrder.findMany({
      where: { orderId: order.id },
      select: { status: true },
    });

    const rolledUpStatus = rollupOrderStatus(currentSubOrders.map((s) => s.status));
    await tx.order.update({
      where: { id: order.id },
      data: { status: rolledUpStatus },
    });

    // Cart retention: mark cart as CONVERTED
    const clearCart = process.env.CLEAR_CART_AFTER_HANDOFF !== 'false';
    if (clearCart && order.cartId) {
      await tx.cart.update({
        where: { id: order.cartId },
        data: {
          status: CartStatus.CONVERTED,
          lastActivityAt: now,
        },
      });
    }
  });

  return {
    redirectUrl: finalRedirectUrl,
    orderNumber: order.orderNumber,
    warnings: adapterResult.warnings,
  };
}
