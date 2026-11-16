import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import {
  unpinProductFromShow,
  AdminShowError,
} from '@/server/admin/shows-service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; productId: string } }
) {
  try {
    const result = await unpinProductFromShow(params.id, params.productId);
    return ok(result, 'Product unpinned from show successfully');
  } catch (err) {
    if (err instanceof AdminShowError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to unpin product from show', 500);
  }
}

