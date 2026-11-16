import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import {
  getAdminDispensaryById,
  updateAdminDispensary,
  AdminDispensaryError,
} from '@/server/admin/dispensaries-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dispensary = await getAdminDispensaryById(params.id);
    return ok(dispensary, 'Dispensary fetched successfully');
  } catch (err) {
    if (err instanceof AdminDispensaryError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to fetch dispensary', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const updated = await updateAdminDispensary(params.id, body);
    return ok(updated, 'Dispensary updated successfully');
  } catch (err) {
    if (err instanceof AdminDispensaryError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to update dispensary', 500);
  }
}

