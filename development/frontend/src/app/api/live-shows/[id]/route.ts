import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import { getLiveShowById } from '@/server/live-shows';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const show = await getLiveShowById(params.id);
    if (!show) {
      return fail('NOT_FOUND', `Live show not found: ${params.id}`, 404);
    }
    return ok(show, 'Live show retrieved successfully');
  } catch (err: any) {
    return fail('INTERNAL_SERVER_ERROR', err?.message || 'Failed to retrieve live show', 500);
  }
}

