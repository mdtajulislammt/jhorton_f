import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import {
  listAdminBrands,
  createAdminBrand,
  AdminBrandError,
} from '@/server/admin/brands-service';

export async function GET(request: NextRequest) {
  try {
    const brands = await listAdminBrands();
    return ok({ items: brands, total: brands.length }, 'Brands fetched successfully');
  } catch (err) {
    if (err instanceof AdminBrandError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to fetch brands', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const brand = await createAdminBrand(body);
    return ok(brand, 'Brand created successfully', 201);
  } catch (err) {
    if (err instanceof AdminBrandError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to create brand', 500);
  }
}

