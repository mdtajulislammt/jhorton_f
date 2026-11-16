import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import { endShow, AdminShowError } from '@/server/admin/shows-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const show = await endShow(params.id);
    return ok(show, 'Live show ended successfully');
  } catch (err) {
    if (err instanceof AdminShowError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to end live show', 500);
  }
}

