import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import {
  listShopperAddresses,
  createShopperAddress,
  shopperAddressSchema,
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
 * GET /api/account/addresses
 * Lists saved addresses for the authenticated shopper.
 * (docs/08 §13, REQ-F-014)
 */
export async function GET(request: NextRequest) {
  try {
    const shopperId = await authenticateShopper(request);
    if (!shopperId) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const items = await listShopperAddresses(shopperId);
    return ok({ items }, 'Addresses retrieved successfully');
  } catch (err: any) {
    if (err instanceof ShopperAccountError) {
      return fail(err.code, err.message, err.status);
    }
    console.error('[GET /api/account/addresses] Error:', err);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to retrieve addresses', 500);
  }
}

/**
 * POST /api/account/addresses
 * Adds a new address to the shopper address book.
 * (docs/08 §13, REQ-F-014)
 */
export async function POST(request: NextRequest) {
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

    const parseResult = shopperAddressSchema.safeParse(body);
    if (!parseResult.success) {
      return fail(
        'VALIDATION_ERROR',
        'Invalid address payload',
        400,
        parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      );
    }

    const created = await createShopperAddress(shopperId, parseResult.data);
    return ok(created, 'Address created successfully', 201);
  } catch (err: any) {
    if (err instanceof ShopperAccountError) {
      return fail(err.code, err.message, err.status);
    }
    console.error('[POST /api/account/addresses] Error:', err);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to create address', 500);
  }
}

