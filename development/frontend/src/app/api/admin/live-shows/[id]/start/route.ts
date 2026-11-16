import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import { startShow, AdminShowError } from '@/server/admin/shows-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const show = await startShow(params.id);
    return ok(show, 'Live show started successfully');
  } catch (err) {
    if (err instanceof AdminShowError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to start live show', 500);
  }
}

