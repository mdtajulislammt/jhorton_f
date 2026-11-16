import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import { getCartSessionToken } from '@/server/cart/session';
import { CartExpiredError } from '@/server/cart';
import { NoCoverageError } from '@/server/dispensaries';
import {
  createDistributionPreview,
  StoreNotEligibleError,
} from '@/server/distribution';
import { previewDistributionSchema } from '@/server/orders/types';

/**
 * POST /api/orders/preview
 * Evaluates multi-dispensary cart allocation, store eligibility, operational hours,
 * alternatives, and unfulfillable items. Returns allocation preview and previewHash.
 * (docs/08 §8.1, docs/06 §4, ADR-007, ADR-011, ADR-012)
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

    const parseResult = previewDistributionSchema.safeParse(body);
    if (!parseResult.success) {
      return fail(
        'VALIDATION_ERROR',
        'Invalid preview request',
        400,
        parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      );
    }

    const { fulfillmentType, zip, preferredDispensaryId, itemOverrides } =
      parseResult.data;

    const result = await createDistributionPreview({
      cartSessionToken: sessionToken,
      fulfillmentType,
      zip,
      preferredDispensaryId,
      itemOverrides,
    });

    return ok(result, 'OK');
  } catch (err: any) {
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

    if (err instanceof CartExpiredError || err.name === 'CartExpiredError') {
      return fail('CART_EXPIRED', err.message, 410);
    }

    if (err.message === 'Cart not found') {
      return fail('NOT_FOUND', 'Active cart not found', 404);
    }

    console.error('[POST /api/orders/preview] Error:', err);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to generate distribution preview', 500);
  }
}

