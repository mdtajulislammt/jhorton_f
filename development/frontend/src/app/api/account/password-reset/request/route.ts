import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import {
  requestPasswordReset,
  requestPasswordResetSchema,
  ShopperAccountError,
} from '@/server/shopper-account';

/**
 * POST /api/account/password-reset/request
 * Initiates single-use 1-hour password reset email.
 * Always returns 200 to prevent account enumeration. Rate-limited to 5/min.
 * (docs/08 §13, docs/10 §1)
 */
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail('VALIDATION_ERROR', 'Invalid JSON body', 400);
    }

    const parseResult = requestPasswordResetSchema.safeParse(body);
    if (!parseResult.success) {
      return fail(
        'VALIDATION_ERROR',
        'Valid email address is required',
        400,
        parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      );
    }

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const envAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!envAppUrl && process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL SECURITY ERROR: NEXT_PUBLIC_APP_URL environment variable is missing in production.');
    }

    const baseUrl =
      envAppUrl ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    const result = await requestPasswordReset(parseResult.data, baseUrl, clientIp);
    return ok(result, result.message, 200);
  } catch (err: any) {
    if (err instanceof ShopperAccountError) {
      return fail(err.code, err.message, err.status);
    }
    console.error('[POST /api/account/password-reset/request] Error:', err);
    return fail('INTERNAL_SERVER_ERROR', 'Password reset request failed', 500);
  }
}

