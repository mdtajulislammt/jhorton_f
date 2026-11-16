import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import {
  assignBrandDispensaries,
  AdminBrandError,
} from '@/server/admin/brands-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const dispensaryIds = body.dispensaryIds || [];

    const updated = await assignBrandDispensaries(params.id, dispensaryIds);
    return ok(updated, 'Brand dispensaries assigned successfully');
  } catch (err) {
    if (err instanceof AdminBrandError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to assign brand dispensaries', 500);
  }
}

