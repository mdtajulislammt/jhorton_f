import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import { getCartSessionToken } from '@/server/cart/session';
import {
  ForbiddenOrderAccessError,
  getOrderById,
  OrderNotFoundError,
} from '@/server/orders';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET /api/orders/{id}
 * Retrieves full order details and sub-orders for confirmation and tracking.
 * Enforces ownership check against cart session or authenticated shopper.
 * (docs/08 §8.3)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const orderId = context.params.id;
    if (!orderId) {
      return fail('VALIDATION_ERROR', 'Order ID is required', 400);
    }

    const cartSessionToken = getCartSessionToken(request);
    const shopperCookie = request.cookies.get('owt_shopper')?.value || null;

    const order = await getOrderById(orderId, {
      cartSessionToken,
      shopperId: shopperCookie,
    });

    return ok(order, 'Order retrieved', 200);
  } catch (err: any) {
    if (err instanceof OrderNotFoundError || err.code === 'NOT_FOUND') {
      return fail('NOT_FOUND', err.message, 404);
    }

    if (err instanceof ForbiddenOrderAccessError || err.code === 'FORBIDDEN') {
      return fail('FORBIDDEN', err.message, 403);
    }

    console.error(`[GET /api/orders/${context.params.id}] Error:`, err);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to retrieve order', 500);
  }
}

