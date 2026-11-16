import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import {
  pinProductToShow,
  AdminShowError,
} from '@/server/admin/shows-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const { productId, sortOrder } = body;

    if (!productId) {
      return fail('VALIDATION_ERROR', 'productId is required to pin a product', 400);
    }

    const pinned = await pinProductToShow(params.id, productId, sortOrder ?? 0);
    return ok(pinned, 'Product pinned to show successfully');
  } catch (err) {
    if (err instanceof AdminShowError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to pin product to show', 500);
  }
}

