import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import {
  getAdminProductById,
  updateAdminProduct,
  deleteAdminProduct,
  AdminProductError,
} from '@/server/admin/products-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await getAdminProductById(params.id);
    return ok(product, 'Product fetched successfully');
  } catch (err) {
    if (err instanceof AdminProductError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to fetch product', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const updated = await updateAdminProduct(params.id, body);
    return ok(updated, 'Product updated successfully');
  } catch (err) {
    if (err instanceof AdminProductError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to update product', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await deleteAdminProduct(params.id);
    return ok(result, 'Product deleted successfully');
  } catch (err) {
    if (err instanceof AdminProductError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to delete product', 500);
  }
}

