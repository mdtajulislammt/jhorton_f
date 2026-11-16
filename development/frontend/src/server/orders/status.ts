import { OrderStatus, SubOrderStatus } from '@prisma/client';

/**
 * Calculates the parent OrderStatus based on the statuses of its child SubOrders.
 *
 * Rules (docs/06 §3, docs/08 §8):
 * - Parent CONFIRMED only when all sub-orders are confirmed.
 * - Parent PARTIALLY_CONFIRMED when at least one sub-order is confirmed but not all.
 * - Parent CANCELLED when all sub-orders are cancelled or rejected.
 * - Parent HANDED_OFF when all active sub-orders are handed off.
 * - Otherwise PENDING.
 */
export function rollupOrderStatus(statuses: SubOrderStatus[]): OrderStatus {
  if (statuses.length === 0) {
    return OrderStatus.PENDING;
  }

  const allConfirmed = statuses.every((s) => s === SubOrderStatus.CONFIRMED);
  if (allConfirmed) {
    return OrderStatus.CONFIRMED;
  }

  const someConfirmed = statuses.some((s) => s === SubOrderStatus.CONFIRMED);
  if (someConfirmed) {
    return OrderStatus.PARTIALLY_CONFIRMED;
  }

  const allTerminalCancelled = statuses.every(
    (s) => s === SubOrderStatus.CANCELLED || s === SubOrderStatus.REJECTED
  );
  if (allTerminalCancelled) {
    return OrderStatus.CANCELLED;
  }

  const allHandedOff = statuses.every((s) => s === SubOrderStatus.HANDED_OFF);
  if (allHandedOff) {
    return OrderStatus.HANDED_OFF;
  }

  return OrderStatus.PENDING;
}

