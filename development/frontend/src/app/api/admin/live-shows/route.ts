import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import {
  listAdminShows,
  createAdminShow,
  AdminShowError,
} from '@/server/admin/shows-service';

export async function GET(request: NextRequest) {
  try {
    const shows = await listAdminShows();
    return ok({ items: shows, total: shows.length }, 'Live shows fetched successfully');
  } catch (err) {
    if (err instanceof AdminShowError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to fetch live shows', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const show = await createAdminShow(body);
    return ok(show, 'Live show created successfully', 201);
  } catch (err) {
    if (err instanceof AdminShowError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to create live show', 500);
  }
}

