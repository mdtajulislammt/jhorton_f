import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import {
  loginShopper,
  loginShopperSchema,
  ShopperAccountError,
  SHOPPER_COOKIE_NAME,
  SHOPPER_COOKIE_OPTIONS,
} from '@/server/shopper-account';
import { getCartSessionToken } from '@/server/cart/session';

/**
 * POST /api/account/login
 * Authenticates shopper, merges anonymous cart lines into shopper cart,
 * sets owt_shopper cookie, enforced 5/min rate limit.
 * (docs/08 §13, docs/10 §1, REQ-F-014, AC-PRF-02)
 */
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail('VALIDATION_ERROR', 'Invalid JSON body', 400);
    }

    const parseResult = loginShopperSchema.safeParse(body);
    if (!parseResult.success) {
      return fail(
        'VALIDATION_ERROR',
        'Invalid login credentials',
        400,
        parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      );
    }

    const cartSessionToken = getCartSessionToken(request);
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const result = await loginShopper(parseResult.data, cartSessionToken, clientIp);

    const response = ok(
      { shopper: result.shopper },
      'Logged in successfully',
      200
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
    console.error('[POST /api/account/login] Error:', err);
    return fail('INTERNAL_SERVER_ERROR', 'Login failed', 500);
  }
}

