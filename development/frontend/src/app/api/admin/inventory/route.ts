import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import {
  listAdminInventory,
  bulkUpdateAdminInventory,
  AdminInventoryError,
} from '@/server/admin/inventory-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const dispensaryId = searchParams.get('dispensaryId') || undefined;
    const productId = searchParams.get('productId') || undefined;

    const items = await listAdminInventory({ dispensaryId, productId });
    return ok({ items, total: items.length }, 'Inventory fetched successfully');
  } catch (err) {
    if (err instanceof AdminInventoryError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to fetch inventory', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const items = body.items || body;

    const result = await bulkUpdateAdminInventory(items);
    return ok(result, 'Inventory updated successfully');
  } catch (err) {
    if (err instanceof AdminInventoryError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to update inventory', 500);
  }
}

