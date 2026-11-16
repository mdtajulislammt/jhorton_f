import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import {
  listAdminDispensaries,
  createAdminDispensary,
  AdminDispensaryError,
} from '@/server/admin/dispensaries-service';

export async function GET(request: NextRequest) {
  try {
    const dispensaries = await listAdminDispensaries();
    return ok({ items: dispensaries, total: dispensaries.length }, 'Dispensaries fetched successfully');
  } catch (err) {
    if (err instanceof AdminDispensaryError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to fetch dispensaries', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const dispensary = await createAdminDispensary(body);
    return ok(dispensary, 'Dispensary created successfully', 201);
  } catch (err) {
    if (err instanceof AdminDispensaryError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to create dispensary', 500);
  }
}

