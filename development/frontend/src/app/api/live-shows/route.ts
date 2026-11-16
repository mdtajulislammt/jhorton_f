import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import { listLiveShows } from '@/server/live-shows';
import { liveShowsQuerySchema } from '@/server/live-shows/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = {
      status: searchParams.get('status') || undefined,
      format: searchParams.get('format') || undefined,
      brand: searchParams.get('brand') || undefined,
    };

    const parsed = liveShowsQuerySchema.safeParse(rawQuery);
    if (!parsed.success) {
      return fail('VALIDATION_ERROR', 'Invalid query parameters for live-shows', 400, parsed.error.issues);
    }

    const items = await listLiveShows(parsed.data);
    return ok({ items }, 'Live shows retrieved successfully');
  } catch (err: any) {
    return fail('INTERNAL_SERVER_ERROR', err?.message || 'Failed to list live shows', 500);
  }
}

