import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import { CART_COOKIE_NAME } from '@/server/cart/session';
import {
  checkoutHandoffSchema,
  executeCheckoutHandoff,
  ForbiddenOrderAccessError,
  OrderNotFoundError,
  ProviderConfigurationError,
  SubOrderNotFoundError,
} from '@/server/checkout-handoff';

/**
 * POST /api/checkout/handoff
 *
 * Compliant checkout handoff endpoint (docs/08 §9, ADR-005, T-HND-01, AC-HND-01).
 * Generates handoff URL for Leafly or direct retailer menu and updates sub-order
 * status to HANDED_OFF.
 *
 * Enforces Zero ID & Zero Payment policy: rejects any unexpected payload fields.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail('VALIDATION_ERROR', 'Invalid JSON body', 400);
  }

  const parseResult = checkoutHandoffSchema.safeParse(body);
  if (!parseResult.success) {
    const details = parseResult.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return fail('VALIDATION_ERROR', 'Invalid handoff request payload', 400, details);
  }

  const { orderId, subOrderId } = parseResult.data;
  const cartToken =
    request.cookies.get(CART_COOKIE_NAME)?.value ||
    request.headers.get('x-cart-token') ||
    null;
  const shopperCookie = request.cookies.get('owt_shopper')?.value || null;

  try {
    const result = await executeCheckoutHandoff({
      orderId,
      subOrderId,
      session: {
        cartSessionToken: cartToken,
        shopperId: shopperCookie,
      },
    });

    return ok(result, 'Ready for handoff', 200);
  } catch (err: any) {
    if (err instanceof OrderNotFoundError || err.code === 'NOT_FOUND') {
      return fail('NOT_FOUND', err.message || 'Order not found', 404);
    }

    if (err instanceof SubOrderNotFoundError || err.code === 'SUB_ORDER_NOT_FOUND') {
      return fail('SUB_ORDER_NOT_FOUND', err.message || 'Sub-order not found', 404);
    }

    if (err instanceof ForbiddenOrderAccessError || err.code === 'FORBIDDEN') {
      return fail('FORBIDDEN', err.message || 'Access to order denied', 403);
    }

    if (err instanceof ProviderConfigurationError) {
      return fail('UPSTREAM_ERROR', err.message, 502);
    }

    return fail('SERVER_ERROR', 'Failed to execute checkout handoff', 500);
  }
}

