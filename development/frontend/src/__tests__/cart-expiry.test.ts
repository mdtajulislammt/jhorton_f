import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShowStatus, CartStatus } from '@prisma/client';
import {
  calculateCartExpiration,
  isCartExpired,
  recomputeHeldCarts,
  CART_INACTIVITY_TTL_MS,
} from '@/server/cart/expiry';

vi.mock('@/server/db', () => ({
  prisma: {
    liveShow: {
      findUnique: vi.fn(),
    },
    cart: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((callbacks) => (typeof callbacks === 'function' ? callbacks() : Promise.all(callbacks))),
  },
}));

import { prisma } from '@/server/db';

describe('Cart Expiry & Hold Rules (docs/07 §2.2, AC-CART-02, AC-HOLD-01, T-CART-01, T-HOLD-01)', () => {
  const baseTime = new Date('2026-11-15T12:00:00.000Z');

  describe('calculateCartExpiration - Non-show carts (Sliding Inactivity)', () => {
    it('sets expiresAt = lastActivityAt + 30 min for non-show cart (T-CART-01)', () => {
      const cart = {
        lastActivityAt: baseTime,
        liveShowId: null,
      };

      const result = calculateCartExpiration(cart, null, baseTime);

      const expectedExpiration = new Date(baseTime.getTime() + 30 * 60 * 1000);
      expect(result.expiresAt.toISOString()).toBe(expectedExpiration.toISOString());
      expect(result.hold.reason).toBe('INACTIVITY');
      expect(result.hold.expiresAt).toBe(expectedExpiration.toISOString());
    });
  });

  describe('calculateCartExpiration - Live Show Carts (AC-HOLD-01, T-HOLD-01)', () => {
    it('keeps cart held while show is LIVE and endedAt is null', () => {
      const now = new Date('2026-11-15T12:15:00.000Z');
      const cart = {
        lastActivityAt: baseTime, // 12:00:00
        liveShowId: 'show-1',
      };
      const liveShow = {
        id: 'show-1',
        title: 'Owtlet Live Drop: Sunset Sherbet',
        status: ShowStatus.LIVE,
        endedAt: null,
        scheduledEndAt: new Date('2026-11-15T13:00:00.000Z'),
      };

      const result = calculateCartExpiration(cart, liveShow, now);

      // In live mode, expiresAt is calculated from max(now, lastActivityAt) + 30 min
      const expectedExpiration = new Date(now.getTime() + 30 * 60 * 1000);
      expect(result.expiresAt.toISOString()).toBe(expectedExpiration.toISOString());
      expect(result.hold.reason).toBe('LIVE_SHOW');
      expect(result.hold.showStatus).toBe(ShowStatus.LIVE);
      expect(result.hold.showTitle).toBe('Owtlet Live Drop: Sunset Sherbet');
    });

    it('sets expiresAt = max(lastActivityAt, endedAt) + 30 min after show ends (T-HOLD-01)', () => {
      const showEnd = new Date('2026-11-15T13:00:00.000Z');
      const cartActivity = new Date('2026-11-15T12:45:00.000Z');
      const cart = {
        lastActivityAt: cartActivity,
        liveShowId: 'show-1',
      };
      const liveShow = {
        id: 'show-1',
        title: 'Owtlet Live Drop: Sunset Sherbet',
        status: ShowStatus.REPLAY,
        endedAt: showEnd,
        scheduledEndAt: new Date('2026-11-15T13:00:00.000Z'),
      };

      const result = calculateCartExpiration(cart, liveShow, new Date('2026-11-15T13:05:00.000Z'));

      // showEnd (13:00) > cartActivity (12:45) -> 13:00 + 30 min = 13:30
      const expectedExpiration = new Date(showEnd.getTime() + 30 * 60 * 1000);
      expect(result.expiresAt.toISOString()).toBe(expectedExpiration.toISOString());
      expect(result.hold.reason).toBe('LIVE_SHOW');
    });

    it('uses lastActivityAt if shopper changed cart AFTER the show ended', () => {
      const showEnd = new Date('2026-11-15T13:00:00.000Z');
      const lateActivity = new Date('2026-11-15T13:10:00.000Z');
      const cart = {
        lastActivityAt: lateActivity,
        liveShowId: 'show-1',
      };
      const liveShow = {
        id: 'show-1',
        title: 'Owtlet Live Drop',
        status: ShowStatus.REPLAY,
        endedAt: showEnd,
        scheduledEndAt: showEnd,
      };

      const result = calculateCartExpiration(cart, liveShow, lateActivity);

      // lateActivity (13:10) > showEnd (13:00) -> 13:10 + 30 min = 13:40
      const expectedExpiration = new Date(lateActivity.getTime() + 30 * 60 * 1000);
      expect(result.expiresAt.toISOString()).toBe(expectedExpiration.toISOString());
    });

    it('falls back to scheduledEndAt if show is ended but endedAt was never recorded', () => {
      const scheduledEnd = new Date('2026-11-15T13:00:00.000Z');
      const cart = {
        lastActivityAt: baseTime,
        liveShowId: 'show-1',
      };
      const liveShow = {
        id: 'show-1',
        title: 'Owtlet Live Drop',
        status: ShowStatus.REPLAY,
        endedAt: null,
        scheduledEndAt: scheduledEnd,
      };

      const result = calculateCartExpiration(cart, liveShow, new Date('2026-11-15T13:05:00.000Z'));

      const expectedExpiration = new Date(scheduledEnd.getTime() + 30 * 60 * 1000);
      expect(result.expiresAt.toISOString()).toBe(expectedExpiration.toISOString());
    });
  });

  describe('isCartExpired', () => {
    it('returns true when cart status is explicitly EXPIRED', () => {
      const cart = {
        status: CartStatus.EXPIRED,
        expiresAt: new Date(baseTime.getTime() + 10000),
      };
      expect(isCartExpired(cart, baseTime)).toBe(true);
    });

    it('returns true when current time is past expiresAt', () => {
      const cart = {
        status: CartStatus.ACTIVE,
        expiresAt: new Date('2026-11-15T12:30:00.000Z'),
      };
      const pastTime = new Date('2026-11-15T12:30:01.000Z');
      expect(isCartExpired(cart, pastTime)).toBe(true);
    });

    it('returns false when cart is ACTIVE and before expiresAt', () => {
      const cart = {
        status: CartStatus.ACTIVE,
        expiresAt: new Date('2026-11-15T12:30:00.000Z'),
      };
      const activeTime = new Date('2026-11-15T12:20:00.000Z');
      expect(isCartExpired(cart, activeTime)).toBe(false);
    });
  });

  describe('recomputeHeldCarts', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('recomputes expiresAt for all active carts linked to the show', async () => {
      const endedAt = new Date('2026-11-15T13:00:00.000Z');
      (prisma.liveShow.findUnique as any).mockResolvedValue({
        id: 'show-1',
        title: 'Owtlet Live Drop',
        status: ShowStatus.REPLAY,
        endedAt,
        scheduledEndAt: endedAt,
      });

      (prisma.cart.findMany as any).mockResolvedValue([
        {
          id: 'cart-1',
          lastActivityAt: new Date('2026-11-15T12:45:00.000Z'),
          liveShowId: 'show-1',
        },
        {
          id: 'cart-2',
          lastActivityAt: new Date('2026-11-15T13:05:00.000Z'),
          liveShowId: 'show-1',
        },
      ]);

      (prisma.cart.update as any).mockResolvedValue({});

      const count = await recomputeHeldCarts('show-1');

      expect(count).toBe(2);
      expect(prisma.cart.findMany).toHaveBeenCalledWith({
        where: {
          liveShowId: 'show-1',
          status: CartStatus.ACTIVE,
        },
        select: expect.any(Object),
      });
      expect(prisma.cart.update).toHaveBeenCalledTimes(2);
    });

    it('returns 0 when show is not found or has no active carts', async () => {
      (prisma.liveShow.findUnique as any).mockResolvedValue(null);
      const count = await recomputeHeldCarts('non-existent');
      expect(count).toBe(0);
    });
  });
});
