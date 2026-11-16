import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import {
  listAdminProducts,
  createAdminProduct,
  AdminProductError,
} from '@/server/admin/products-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') || undefined;
    const brandId = searchParams.get('brandId') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const isActiveParam = searchParams.get('isActive');
    const isActive = isActiveParam !== null ? isActiveParam === 'true' : undefined;

    const products = await listAdminProducts({ search, brandId, categoryId, isActive });
    return ok({ items: products, total: products.length }, 'Products fetched successfully');
  } catch (err) {
    if (err instanceof AdminProductError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to fetch products', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const product = await createAdminProduct(body);
    return ok(product, 'Product created successfully', 201);
  } catch (err) {
    if (err instanceof AdminProductError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to create product', 500);
  }
}

