import { ShowStatus, CartStatus } from '@prisma/client';
import { prisma } from '../db';

export const CART_INACTIVITY_TTL_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

export type CartHoldReason = 'LIVE_SHOW' | 'INACTIVITY';

export interface CartHoldMetadata {
  reason: CartHoldReason;
  liveShowId?: string;
  showStatus?: ShowStatus;
  showTitle?: string;
  expiresAt: string;
}

export interface LiveShowHoldInput {
  id: string;
  title: string;
  status: ShowStatus;
  endedAt: Date | null;
  scheduledEndAt: Date | null;
}

export interface ExpirationCalculationResult {
  expiresAt: Date;
  hold: CartHoldMetadata;
}

/**
 * Calculates the expiration timestamp and hold metadata for a cart based on
 * docs/07 §2.2 and docs/08 §4.
 *
 * Rules:
 * 1. Default (non-show): expiresAt = lastActivityAt + 30 minutes (sliding inactivity window).
 * 2. Linked to LIVE show (show.status === 'LIVE' and endedAt === null):
 *    Held continuously while the show is running; expiresAt is refreshed to max(now, lastActivityAt) + 30 min.
 * 3. Linked to ended show:
 *    expiresAt = max(lastActivityAt + 30 min, effectiveEnd + 30 min), where effectiveEnd is endedAt ?? scheduledEndAt.
 */
export function calculateCartExpiration(
  cart: {
    lastActivityAt: Date;
    liveShowId?: string | null;
  },
  liveShow?: LiveShowHoldInput | null,
  now = new Date()
): ExpirationCalculationResult {
  if (cart.liveShowId && liveShow) {
    const isLive = liveShow.status === ShowStatus.LIVE && !liveShow.endedAt;

    if (isLive) {
      const baseTime = Math.max(now.getTime(), cart.lastActivityAt.getTime());
      const expiresAt = new Date(baseTime + CART_INACTIVITY_TTL_MS);

      return {
        expiresAt,
        hold: {
          reason: 'LIVE_SHOW',
          liveShowId: liveShow.id,
          showStatus: liveShow.status,
          showTitle: liveShow.title,
          expiresAt: expiresAt.toISOString(),
        },
      };
    }

    // Show has ended or has a scheduled end
    const effectiveEnd = liveShow.endedAt ?? liveShow.scheduledEndAt ?? cart.lastActivityAt;
    const baseTime = Math.max(cart.lastActivityAt.getTime(), effectiveEnd.getTime());
    const expiresAt = new Date(baseTime + CART_INACTIVITY_TTL_MS);

    return {
      expiresAt,
      hold: {
        reason: 'LIVE_SHOW',
        liveShowId: liveShow.id,
        showStatus: liveShow.status,
        showTitle: liveShow.title,
        expiresAt: expiresAt.toISOString(),
      },
    };
  }

  // Standard sliding inactivity
  const expiresAt = new Date(cart.lastActivityAt.getTime() + CART_INACTIVITY_TTL_MS);
  return {
    expiresAt,
    hold: {
      reason: 'INACTIVITY',
      expiresAt: expiresAt.toISOString(),
    },
  };
}

/**
 * Checks if a cart is expired according to its status or expiration timestamp.
 */
export function isCartExpired(
  cart: {
    expiresAt: Date;
    status: CartStatus;
  },
  now = new Date()
): boolean {
  if (cart.status === CartStatus.EXPIRED) {
    return true;
  }
  return cart.expiresAt.getTime() <= now.getTime();
}

/**
 * Recomputes and updates the expiration time for all active carts linked to a live show.
 * Invoked when an admin ends a show or when show status changes (TASK-016, docs/07 §2.2).
 */
export async function recomputeHeldCarts(showId: string): Promise<number> {
  const show = await prisma.liveShow.findUnique({
    where: { id: showId },
    select: {
      id: true,
      title: true,
      status: true,
      endedAt: true,
      scheduledEndAt: true,
    },
  });

  if (!show) {
    return 0;
  }

  const activeCarts = await prisma.cart.findMany({
    where: {
      liveShowId: showId,
      status: CartStatus.ACTIVE,
    },
    select: {
      id: true,
      lastActivityAt: true,
      liveShowId: true,
    },
  });

  if (activeCarts.length === 0) {
    return 0;
  }

  const now = new Date();
  await prisma.$transaction(
    activeCarts.map((cart) => {
      const { expiresAt } = calculateCartExpiration(cart, show, now);
      return prisma.cart.update({
        where: { id: cart.id },
        data: { expiresAt },
      });
    })
  );

  return activeCarts.length;
}
