import { CartStatus, OrderStatus, Prisma, SubOrderStatus } from '@prisma/client';
import { prisma } from '../db';
import { calculateCartExpiration, isCartExpired } from '../cart/expiry';
import { CartExpiredError } from '../cart';
import { createDistributionPreview } from '../distribution/preview';
import { generateOrderNumber } from './order-number';
import {
  CartEmptyError,
  CreateOrderInput,
  OrderCreatedDto,
  OrderNotFoundError,
  PreviewStaleError,
  UnfulfillableItemsError,
} from './types';

export interface CreateOrderSessionContext {
  cartSessionToken?: string | null;
  shopperId?: string | null;
}

export interface CreateOrderResult {
  order: OrderCreatedDto;
  isExisting: boolean;
}

/**
 * Creates a parent Order and dispensary SubOrders atomically.
 * (docs/06 §3, docs/08 §8.2, ADR-007, ADR-012)
 *
 * Rules:
 * - Rejects DOB/ID/payment fields (enforced by strict Zod schema before calling).
 * - Idempotent per cart: returns existing order (200) if already checked out.
 * - Rejects with 410 CART_EXPIRED if cart hold expired.
 * - Rejects with 422 UNFULFILLABLE_ITEMS if cart contains unfulfillable lines.
 * - Rejects with 409 PREVIEW_STALE if prices/stock changed since preview.
 * - Creates Order + SubOrders + OrderItems inside a database transaction.
 * - Marks Cart as CHECKED_OUT.
 */
export async function createOrder(
  input: CreateOrderInput,
  session: CreateOrderSessionContext
): Promise<CreateOrderResult> {
  const { cartSessionToken, shopperId } = session;

  if (!cartSessionToken) {
    throw new OrderNotFoundError('Cart session not found');
  }

  // 1. Fetch Cart
  const cart = await prisma.cart.findFirst({
    where: { sessionToken: cartSessionToken },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      liveShow: true,
      order: {
        include: {
          subOrders: true,
        },
      },
    },
  });

  if (!cart) {
    throw new OrderNotFoundError('Cart not found');
  }

  // 2. Idempotency Check: Already checked out?
  if (cart.status === CartStatus.CHECKED_OUT && cart.order) {
    return {
      isExisting: true,
      order: {
        orderId: cart.order.id,
        orderNumber: cart.order.orderNumber,
        status: cart.order.status,
        subtotal: cart.order.subtotal.toFixed(2),
        subOrders: cart.order.subOrders.map((so) => ({
          id: so.id,
          dispensaryId: so.dispensaryId,
          status: so.status,
          subtotal: so.subtotal.toFixed(2),
        })),
      },
    };
  }

  if (cart.items.length === 0) {
    throw new CartEmptyError();
  }

  // 3. Expiration Check
  const now = new Date();
  const { expiresAt } = calculateCartExpiration(
    { lastActivityAt: cart.lastActivityAt, liveShowId: cart.liveShowId },
    cart.liveShow,
    now
  );

  if (isCartExpired({ expiresAt, status: cart.status }, now)) {
    throw new CartExpiredError();
  }

  // 4. Re-evaluate Distribution Preview with Current DB State
  const preview = await createDistributionPreview({
    cartId: cart.id,
    fulfillmentType: input.fulfillmentType,
    zip: input.zip,
    itemOverrides: input.itemOverrides,
    preferredDispensaryId: input.preferredDispensaryId,
    now,
  });

  // Guard: Unfulfillable items exist
  if (preview.unfulfillable.length > 0) {
    throw new UnfulfillableItemsError(preview.unfulfillable);
  }

  // Guard: Stale preview hash
  if (preview.previewHash !== input.previewHash) {
    throw new PreviewStaleError();
  }

  // 5. Database Transaction: Create Order, SubOrders, OrderItems & Mark Cart Checked Out
  const result = await prisma.$transaction(async (tx) => {
    const orderNumber = await generateOrderNumber(tx as any);

    const createdOrder = await tx.order.create({
      data: {
        orderNumber,
        cartId: cart.id,
        shopperId: shopperId || cart.shopperId || null,
        fulfillmentType: input.fulfillmentType,
        zip: input.zip,
        contactFirstName: input.contact.firstName,
        contactLastName: input.contact.lastName,
        contactEmail: input.contact.email,
        contactPhone: input.contact.phone,
        deliveryLine1: input.deliveryAddress?.line1 || null,
        deliveryLine2: input.deliveryAddress?.line2 || null,
        deliveryCity: input.deliveryAddress?.city || null,
        deliveryState: input.deliveryAddress?.state || 'NY',
        status: OrderStatus.PENDING,
        subtotal: new Prisma.Decimal(preview.total),
      },
    });

    const createdSubOrders: Array<{
      id: string;
      dispensaryId: string;
      status: SubOrderStatus;
      subtotal: string;
    }> = [];

    for (const subOrder of preview.subOrders) {
      const createdSubOrder = await tx.subOrder.create({
        data: {
          orderId: createdOrder.id,
          dispensaryId: subOrder.dispensaryId,
          fulfillmentType: subOrder.fulfillmentType,
          assignment: subOrder.assignment,
          channelBrandId: subOrder.channelBrandId || null,
          status: SubOrderStatus.PENDING,
          handoffChannel: subOrder.handoffChannel,
          subtotal: new Prisma.Decimal(subOrder.subtotal),
        },
      });

      for (const item of subOrder.items) {
        await tx.orderItem.create({
          data: {
            subOrderId: createdSubOrder.id,
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice),
          },
        });
      }

      createdSubOrders.push({
        id: createdSubOrder.id,
        dispensaryId: createdSubOrder.dispensaryId,
        status: createdSubOrder.status,
        subtotal: createdSubOrder.subtotal.toFixed(2),
      });
    }

    // Mark Cart as CHECKED_OUT
    await tx.cart.update({
      where: { id: cart.id },
      data: {
        status: CartStatus.CHECKED_OUT,
        zip: input.zip,
      },
    });

    // Optional: Save delivery address to shopper profile if requested
    if (
      input.saveToProfile &&
      (shopperId || cart.shopperId) &&
      input.deliveryAddress
    ) {
      const targetShopperId = (shopperId || cart.shopperId)!;
      await tx.shopperAddress.create({
        data: {
          shopperId: targetShopperId,
          line1: input.deliveryAddress.line1,
          line2: input.deliveryAddress.line2 || null,
          city: input.deliveryAddress.city,
          state: input.deliveryAddress.state || 'NY',
          zip: input.deliveryAddress.zip,
        },
      });
    }

    return {
      orderId: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      status: createdOrder.status,
      subtotal: createdOrder.subtotal.toFixed(2),
      subOrders: createdSubOrders,
    };
  });

  return {
    order: result,
    isExisting: false,
  };
}
