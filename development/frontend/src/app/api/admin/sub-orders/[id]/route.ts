import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import {
  updateSubOrderStatus,
  AdminOrderError,
} from '@/server/admin/orders-service';
import { SubOrderStatus } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const { status, note } = body;

    if (!status || !Object.values(SubOrderStatus).includes(status)) {
      return fail('INVALID_STATUS', `Valid SubOrderStatus is required (${Object.values(SubOrderStatus).join(', ')})`, 400);
    }

    const result = await updateSubOrderStatus(params.id, status, note);
    return ok(result, 'Sub-order status updated successfully');
  } catch (err) {
    if (err instanceof AdminOrderError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to update sub-order status', 500);
  }
}

