import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import {
  updateAdminShow,
  AdminShowError,
} from '@/server/admin/shows-service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const updated = await updateAdminShow(params.id, body);
    return ok(updated, 'Live show updated successfully');
  } catch (err) {
    if (err instanceof AdminShowError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to update live show', 500);
  }
}

