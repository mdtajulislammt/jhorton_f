import { prisma } from '../db';
import {
  ForbiddenOrderAccessError,
  OrderDetailDto,
  OrderNotFoundError,
} from './types';

export interface GetOrderSessionContext {
  cartSessionToken?: string | null;
  shopperId?: string | null;
  isAdmin?: boolean;
}

/**
 * Retrieves full order details by ID for confirmation screens.
 * Enforces ownership check against the cart session token or authenticated shopper ID.
 * (docs/08 §8.3)
 */
export async function getOrderById(
  orderId: string,
  session: GetOrderSessionContext = {}
): Promise<OrderDetailDto> {
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
          dispensary: {
            select: {
              name: true,
            },
          },
          items: {
            orderBy: { id: 'asc' },
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
    throw new ForbiddenOrderAccessError('You do not have permission to view this order');
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    cartId: order.cartId,
    shopperId: order.shopperId,
    fulfillmentType: order.fulfillmentType,
    zip: order.zip,
    status: order.status,
    subtotal: order.subtotal.toFixed(2),
    contact: {
      firstName: order.contactFirstName,
      lastName: order.contactLastName,
      email: order.contactEmail,
      phone: order.contactPhone,
    },
    deliveryAddress: order.deliveryLine1
      ? {
          line1: order.deliveryLine1,
          line2: order.deliveryLine2,
          city: order.deliveryCity || '',
          state: order.deliveryState || 'NY',
          zip: order.zip,
        }
      : null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    subOrders: order.subOrders.map((so) => ({
      id: so.id,
      dispensaryId: so.dispensaryId,
      dispensaryName: so.dispensary.name,
      fulfillmentType: so.fulfillmentType,
      assignment: so.assignment,
      channelBrandId: so.channelBrandId,
      status: so.status,
      handoffChannel: so.handoffChannel,
      handoffUrl: so.handoffUrl,
      handedOffAt: so.handedOffAt ? so.handedOffAt.toISOString() : null,
      confirmationRef: so.confirmationRef,
      confirmationUrl: so.confirmationUrl,
      confirmedAt: so.confirmedAt ? so.confirmedAt.toISOString() : null,
      subtotal: so.subtotal.toFixed(2),
      items: so.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice.toFixed(2),
        lineTotal: (Number(it.unitPrice) * it.quantity).toFixed(2),
      })),
    })),
  };
}

