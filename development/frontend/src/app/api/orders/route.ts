import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import { getCartSessionToken } from '@/server/cart/session';
import { CartExpiredError } from '@/server/cart';
import { NoCoverageError } from '@/server/dispensaries';
import { StoreNotEligibleError } from '@/server/distribution';
import {
  createOrder,
  createOrderSchema,
  CartEmptyError,
  OrderNotFoundError,
  PreviewStaleError,
  UnfulfillableItemsError,
} from '@/server/orders';
import { verifyShopperToken } from '@/server/shopper-account/crypto';

/**
 * POST /api/orders
 * Creates parent Order, child SubOrders, and OrderItems inside an atomic transaction.
 * Enforces zero DOB/ID/payment data acceptance, preview freshness check (409),
 * and idempotency per cart (returns existing 200 if already checked out).
 * (docs/08 §8.2, docs/06 §3, ADR-005, ADR-007, ADR-012, AC-SEC-01)
 */
export async function POST(request: NextRequest) {
  try {
    const sessionToken = getCartSessionToken(request);
    if (!sessionToken) {
      return fail('VALIDATION_ERROR', 'Cart session not found', 400);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail('VALIDATION_ERROR', 'Invalid JSON body', 400);
    }

    const parseResult = createOrderSchema.safeParse(body);
    if (!parseResult.success) {
      return fail(
        'VALIDATION_ERROR',
        'Invalid order creation payload',
        400,
        parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      );
    }

    // Shopper session token cookie (if present in optional profile phase)
    const shopperCookie = request.cookies.get('owt_shopper')?.value || null;
    let validatedShopperId: string | null = null;
    if (shopperCookie) {
      const verification = await verifyShopperToken(shopperCookie);
      if (verification.valid && verification.shopperId) {
        validatedShopperId = verification.shopperId;
      }
    }

    const result = await createOrder(parseResult.data, {
      cartSessionToken: sessionToken,
      shopperId: validatedShopperId,
    });

    if (result.isExisting) {
      return ok(result.order, 'Order already created for this cart', 200);
    }

    return ok(result.order, 'Order created', 201);
  } catch (err: any) {
    if (err instanceof PreviewStaleError || err.code === 'PREVIEW_STALE') {
      return fail(
        'PREVIEW_STALE',
        err.message ||
          'Stock availability or pricing has changed since preview. Please refresh preview.',
        409
      );
    }

    if (err instanceof UnfulfillableItemsError || err.code === 'UNFULFILLABLE_ITEMS') {
      return fail(
        'UNFULFILLABLE_ITEMS',
        'Cart contains items that cannot be fulfilled for the selected destination',
        422,
        err.unfulfillable
      );
    }

    if (err instanceof CartExpiredError || err.name === 'CartExpiredError') {
      return fail('CART_EXPIRED', err.message, 410);
    }

    if (err instanceof NoCoverageError || err.code === 'NO_COVERAGE') {
      return fail('NO_COVERAGE', err.message, 422, [
        { field: 'zip', message: 'ZIP code is outside the 5 supported NY regions' },
      ]);
    }

    if (err instanceof StoreNotEligibleError || err.code === 'STORE_NOT_ELIGIBLE') {
      return fail('STORE_NOT_ELIGIBLE', err.message, 422, [
        {
          dispensaryId: err.dispensaryId,
          productId: err.productId,
          message: err.message,
        },
      ]);
    }

    if (err instanceof CartEmptyError || err.code === 'CART_EMPTY') {
      return fail('VALIDATION_ERROR', err.message, 400);
    }

    if (err instanceof OrderNotFoundError || err.code === 'NOT_FOUND') {
      return fail('NOT_FOUND', err.message, 404);
    }

    console.error('[POST /api/orders] Error:', err);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to create order', 500);
  }
}

