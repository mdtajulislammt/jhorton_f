import { SubOrderStatus } from '@prisma/client';
import { prisma } from '../db';
import { rollupOrderStatus } from '../orders/status';
import { getHandoffProvider } from './providers';
import {
  CheckoutHandoffResult,
  ExecuteHandoffOptions,
  ForbiddenOrderAccessError,
  OrderNotFoundError,
  SubOrderNotFoundError,
} from './types';

/**
 * Executes compliant checkout handoff for an order or specific sub-order.
 *
 * Rules (docs/08 §9, ADR-005, T-HND-01, AC-HND-01):
 * - Validates ownership: caller must match cart session token or authenticated shopper ID.
 * - Resolves handoff URL using appropriate provider (RetailerPageProvider or LeaflyProvider).
 * - Transitions sub-order status from PENDING to HANDED_OFF.
 * - Sets `SubOrder.handoffUrl` and `SubOrder.handedOffAt`.
 * - Recomputes and rolls up parent `Order.status` (e.g. HANDED_OFF when all are handed off).
 * - Zero ID & Zero Payment: no payment, credit card, or government ID data is stored or returned.
 */
export async function executeCheckoutHandoff(
  options: ExecuteHandoffOptions
): Promise<CheckoutHandoffResult> {
  const { orderId, subOrderId, session = {} } = options;

  // 1. Fetch order with sub-orders and dispensary information
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      cart: {
        select: {
          sessionToken: true,
        },
      },
      subOrders: {
        include: {
          dispensary: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!order) {
    throw new OrderNotFoundError(`Order with ID ${orderId} not found`);
  }

  // 2. Authorization check (same logic as getOrderById)
  const isAuthorized =
    session.isAdmin ||
    (session.shopperId && order.shopperId === session.shopperId) ||
    (session.cartSessionToken &&
      order.cart &&
      order.cart.sessionToken === session.cartSessionToken);

  if (!isAuthorized) {
    throw new ForbiddenOrderAccessError('You do not have permission to hand off this order');
  }

  // 3. Filter target sub-orders if subOrderId was specified
  let targetSubOrders = order.subOrders;
  if (subOrderId) {
    targetSubOrders = order.subOrders.filter((s) => s.id === subOrderId);
    if (targetSubOrders.length === 0) {
      throw new SubOrderNotFoundError(`Sub-order ${subOrderId} not found in order ${orderId}`);
    }
  }

  // 4. Generate handoff URLs and update sub-orders in transaction
  const handoffResults: CheckoutHandoffResult['handoffs'] = [];
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    for (const subOrder of targetSubOrders) {
      const channel = subOrder.handoffChannel || subOrder.dispensary.handoffChannel;
      const provider = getHandoffProvider(channel);

      const url = await provider.buildUrl({
        subOrder: {
          id: subOrder.id,
          orderId: order.id,
          orderNumber: order.orderNumber,
          dispensaryId: subOrder.dispensaryId,
          subtotal: Number(subOrder.subtotal),
          fulfillmentType: subOrder.fulfillmentType,
        },
        dispensary: {
          id: subOrder.dispensary.id,
          name: subOrder.dispensary.name,
          slug: subOrder.dispensary.slug,
          handoffChannel: subOrder.dispensary.handoffChannel,
          handoffUrlTemplate: subOrder.dispensary.handoffUrlTemplate,
          leaflyStoreId: subOrder.dispensary.leaflyStoreId,
        },
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          zip: order.zip,
          contactFirstName: order.contactFirstName,
          contactLastName: order.contactLastName,
          contactEmail: order.contactEmail,
          contactPhone: order.contactPhone,
        },
      });

      // Sub-order status transition: PENDING -> HANDED_OFF. If already CONFIRMED, preserve CONFIRMED.
      const newStatus =
        subOrder.status === SubOrderStatus.PENDING
          ? SubOrderStatus.HANDED_OFF
          : subOrder.status;

      await tx.subOrder.update({
        where: { id: subOrder.id },
        data: {
          handoffUrl: url,
          handedOffAt: subOrder.handedOffAt || now,
          status: newStatus,
        },
      });

      handoffResults.push({
        subOrderId: subOrder.id,
        channel,
        url,
        dispensaryName: subOrder.dispensary.name,
      });
    }

    // 5. Recompute and roll up parent Order.status
    const allSubOrders = await tx.subOrder.findMany({
      where: { orderId: order.id },
      select: { status: true },
    });

    const rolledUpStatus = rollupOrderStatus(allSubOrders.map((s) => s.status));
    await tx.order.update({
      where: { id: order.id },
      data: { status: rolledUpStatus },
    });
  });

  return {
    handoffs: handoffResults,
  };
}

