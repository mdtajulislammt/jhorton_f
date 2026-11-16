import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import {
  getShopperOrders,
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
 * GET /api/account/orders
 * Retrieves past orders for authenticated shopper (newest first).
 * (docs/08 §13)
 */
export async function GET(request: NextRequest) {
  try {
    const shopperId = await authenticateShopper(request);
    if (!shopperId) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const items = await getShopperOrders(shopperId);
    return ok({ items }, 'Orders retrieved successfully');
  } catch (err: any) {
    if (err instanceof ShopperAccountError) {
      return fail(err.code, err.message, err.status);
    }
    console.error('[GET /api/account/orders] Error:', err);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to retrieve orders', 500);
  }
}

