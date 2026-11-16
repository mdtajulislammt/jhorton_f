import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import {
  updateShopperAddress,
  deleteShopperAddress,
  updateShopperAddressSchema,
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
 * PATCH /api/account/addresses/[id]
 * Updates a saved address.
 * (docs/08 §13)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const parseResult = updateShopperAddressSchema.safeParse(body);
    if (!parseResult.success) {
      return fail(
        'VALIDATION_ERROR',
        'Invalid address updates',
        400,
        parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      );
    }

    const updated = await updateShopperAddress(shopperId, params.id, parseResult.data);
    return ok(updated, 'Address updated successfully');
  } catch (err: any) {
    if (err instanceof ShopperAccountError) {
      return fail(err.code, err.message, err.status);
    }
    console.error(`[PATCH /api/account/addresses/${params.id}] Error:`, err);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to update address', 500);
  }
}

/**
 * DELETE /api/account/addresses/[id]
 * Deletes a saved address.
 * (docs/08 §13)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shopperId = await authenticateShopper(request);
    if (!shopperId) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    await deleteShopperAddress(shopperId, params.id);
    return ok({ success: true }, 'Address deleted successfully');
  } catch (err: any) {
    if (err instanceof ShopperAccountError) {
      return fail(err.code, err.message, err.status);
    }
    console.error(`[DELETE /api/account/addresses/${params.id}] Error:`, err);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to delete address', 500);
  }
}

