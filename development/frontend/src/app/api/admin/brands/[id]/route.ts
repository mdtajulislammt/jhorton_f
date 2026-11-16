import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import {
  getAdminBrandById,
  updateAdminBrand,
  AdminBrandError,
} from '@/server/admin/brands-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const brand = await getAdminBrandById(params.id);
    return ok(brand, 'Brand fetched successfully');
  } catch (err) {
    if (err instanceof AdminBrandError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to fetch brand', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const updated = await updateAdminBrand(params.id, body);
    return ok(updated, 'Brand updated successfully');
  } catch (err) {
    if (err instanceof AdminBrandError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to update brand', 500);
  }
}

