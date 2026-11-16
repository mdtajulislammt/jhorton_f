import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import {
  getShopperProfile,
  updateShopperProfile,
  updateShopperProfileSchema,
  verifyShopperToken,
  ShopperAccountError,
  SHOPPER_COOKIE_NAME,
} from '@/server/shopper-account';

async function authenticateShopper(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(SHOPPER_COOKIE_NAME)?.value;
  if (!token) return null;
  const verification = await verifyShopperToken(token);
  if (!verification.valid || !verification.shopperId) return null;
  return verification.shopperId;
}

/**
 * GET /api/account/profile
 * Retrieves shopper profile including default store.
 * (docs/08 §13, REQ-F-014)
 */
export async function GET(request: NextRequest) {
  try {
    const shopperId = await authenticateShopper(request);
    if (!shopperId) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const profile = await getShopperProfile(shopperId);
    return ok(profile, 'Shopper profile retrieved');
  } catch (err: any) {
    if (err instanceof ShopperAccountError) {
      return fail(err.code, err.message, err.status);
    }
    console.error('[GET /api/account/profile] Error:', err);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to retrieve profile', 500);
  }
}

/**
 * PATCH /api/account/profile
 * Updates shopper profile (name, phone, homeZip, defaultDispensaryId).
 * (docs/08 §13, REQ-F-013, REQ-F-014, AC-SEL-02)
 */
export async function PATCH(request: NextRequest) {
  try {
    const shopperId = await authenticateShopper(request);
    if (!shopperId) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail('VALIDATION_ERROR', 'Invalid JSON body', 400);
    }

    const parseResult = updateShopperProfileSchema.safeParse(body);
    if (!parseResult.success) {
      return fail(
        'VALIDATION_ERROR',
        'Invalid profile data',
        400,
        parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      );
    }

    const updated = await updateShopperProfile(shopperId, parseResult.data);
    return ok(updated, 'Profile updated successfully');
  } catch (err: any) {
    if (err instanceof ShopperAccountError) {
      return fail(err.code, err.message, err.status);
    }
    console.error('[PATCH /api/account/profile] Error:', err);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to update profile', 500);
  }
}

