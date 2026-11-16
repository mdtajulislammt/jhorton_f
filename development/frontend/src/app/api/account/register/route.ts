import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import {
  registerShopper,
  registerShopperSchema,
  ShopperAccountError,
  SHOPPER_COOKIE_NAME,
  SHOPPER_COOKIE_OPTIONS,
} from '@/server/shopper-account';
import { getCartSessionToken } from '@/server/cart/session';

/**
 * POST /api/account/register
 * Registers a new optional shopper profile. Attaches the active cart session if present.
 * Sets owt_shopper HMAC-signed session cookie (30 days).
 * (docs/08 §13, REQ-F-014, AC-PRF-02)
 */
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail('VALIDATION_ERROR', 'Invalid JSON body', 400);
    }

    const parseResult = registerShopperSchema.safeParse(body);
    if (!parseResult.success) {
      return fail(
        'VALIDATION_ERROR',
        'Invalid registration details',
        400,
        parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      );
    }

    const cartSessionToken = getCartSessionToken(request);
    const result = await registerShopper(parseResult.data, cartSessionToken);

    const response = ok(
      { shopper: result.shopper },
      'Account created successfully',
      201
    );

    response.cookies.set(
      SHOPPER_COOKIE_NAME,
      result.token,
      SHOPPER_COOKIE_OPTIONS
    );

    return response;
  } catch (err: any) {
    if (err instanceof ShopperAccountError) {
      return fail(err.code, err.message, err.status);
    }
    console.error('[POST /api/account/register] Error:', err);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to register account', 500);
  }
}

