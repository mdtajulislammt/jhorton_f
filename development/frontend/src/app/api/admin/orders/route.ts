import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import {
  listAdminOrders,
  AdminOrderError,
} from '@/server/admin/orders-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const orders = await listAdminOrders({ status, search });
    return ok({ items: orders, total: orders.length }, 'Orders fetched successfully');
  } catch (err) {
    if (err instanceof AdminOrderError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to fetch orders', 500);
  }
}

