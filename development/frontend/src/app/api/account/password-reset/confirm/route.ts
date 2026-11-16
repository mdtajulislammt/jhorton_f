import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import {
  confirmPasswordReset,
  confirmPasswordResetSchema,
  ShopperAccountError,
} from '@/server/shopper-account';

/**
 * POST /api/account/password-reset/confirm
 * Verifies single-use 1-hour token and updates shopper password (argon2id).
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

    const parseResult = confirmPasswordResetSchema.safeParse(body);
    if (!parseResult.success) {
      return fail(
        'VALIDATION_ERROR',
        'Invalid reset payload',
        400,
        parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      );
    }

    const result = await confirmPasswordReset(parseResult.data);
    return ok(result, 'Password has been reset successfully', 200);
  } catch (err: any) {
    if (err instanceof ShopperAccountError) {
      return fail(err.code, err.message, err.status);
    }
    console.error('[POST /api/account/password-reset/confirm] Error:', err);
    return fail('INTERNAL_SERVER_ERROR', 'Password reset confirmation failed', 500);
  }
}

