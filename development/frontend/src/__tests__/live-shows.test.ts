import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShowStatus, VideoFormat } from '@prisma/client';
import { listLiveShows, getLiveShowById } from '../server/live-shows';
import {
  pinProductToShow,
  startShow,
  endShow,
  AdminShowError,
} from '../server/admin/shows-service';
import { recomputeHeldCarts } from '../server/cart/expiry';

vi.mock('../server/db', () => ({
  prisma: {
    liveShow: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
    showProduct: {
      upsert: vi.fn(),
    },
    cart: {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
    },
    $transaction: vi.fn((callbacks) => (typeof callbacks === 'function' ? callbacks() : Promise.all(callbacks))),
  },
}));

vi.mock('../server/cart/expiry', () => ({
  recomputeHeldCarts: vi.fn().mockResolvedValue(2),
  calculateCartExpiration: vi.fn(),
  isCartExpired: vi.fn(),
  CART_INACTIVITY_TTL_MS: 30 * 60 * 1000,
}));

import { prisma } from '../server/db';

describe('Live Shows Domain Services & Invariants (TASK-016, AC-LIVE-04, AC-HOLD-01, AC-PRC-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. listLiveShows query & ordering', () => {
    it('lists live shows sorted with LIVE first, then SCHEDULED, then REPLAY', async () => {
      const now = new Date('2026-11-16T12:00:00Z');
      const scheduledDate = new Date('2026-11-16T18:00:00Z');
      const endedDate = new Date('2026-11-16T10:00:00Z');

      const mockShows = [
        {
          id: 'show-replay',
          title: 'Past Harvest Replay',
          description: 'Replay of harvest',
          format: VideoFormat.LIVE_SHOW,
          status: ShowStatus.REPLAY,
          scheduledAt: endedDate,
          scheduledEndAt: endedDate,
          startedAt: endedDate,
          endedAt: endedDate,
          thumbnailUrl: '/thumb-replay.jpg',
          embeddingId: 'embed-1',
          terrificShowId: 'terrific-replay',
          createdAt: endedDate,
          brand: { id: 'brand-1', slug: 'hudson-valley', name: 'Hudson Valley' },
          products: [
            {
              sortOrder: 1,
              product: {
                id: 'p-1',
                slug: 'sour-diesel',
                name: 'Sour Diesel',
                terrificProductId: 't-p-1',
                owtletPrice: 45.0,
                imageUrls: ['/img.jpg'],
                category: { name: 'Flower' },
                strain: { name: 'Sour Diesel' },
              },
            },
          ],
        },
        {
          id: 'show-live',
          title: 'Curated NY Craft Live',
          description: 'Live drop right now',
          format: VideoFormat.LIVE_SHOW,
          status: ShowStatus.LIVE,
          scheduledAt: now,
          scheduledEndAt: new Date(now.getTime() + 3600000),
          startedAt: now,
          endedAt: null,
          thumbnailUrl: '/thumb-live.jpg',
          embeddingId: 'embed-2',
          terrificShowId: 'terrific-live',
          createdAt: now,
          brand: { id: 'brand-2', slug: 'gotham-select', name: 'Gotham Select' },
          products: [],
        },
        {
          id: 'show-upcoming',
          title: 'Tomorrow Live Drop',
          description: 'Upcoming drop',
          format: VideoFormat.LIVE_SHOW,
          status: ShowStatus.SCHEDULED,
          scheduledAt: scheduledDate,
          scheduledEndAt: new Date(scheduledDate.getTime() + 3600000),
          startedAt: null,
          endedAt: null,
          thumbnailUrl: '/thumb-upcoming.jpg',
          embeddingId: 'embed-3',
          terrificShowId: 'terrific-upcoming',
          createdAt: now,
          brand: null,
          products: [],
        },
      ];

      (prisma.liveShow.findMany as any).mockResolvedValue(mockShows);

      const items = await listLiveShows({});

      expect(items).toHaveLength(3);
      // LIVE must be sorted first
      expect(items[0].id).toBe('show-live');
      expect(items[0].status).toBe(ShowStatus.LIVE);
      // SCHEDULED must come second
      expect(items[1].id).toBe('show-upcoming');
      expect(items[1].status).toBe(ShowStatus.SCHEDULED);
      // REPLAY must come third
      expect(items[2].id).toBe('show-replay');
      expect(items[2].status).toBe(ShowStatus.REPLAY);

      // Verify product formatting
      expect(items[2].products[0].owtletPrice).toBe('45.00');
      expect(items[2].products[0].categoryName).toBe('Flower');
    });

    it('filters by format SHOPPABLE_VIDEO', async () => {
      (prisma.liveShow.findMany as any).mockResolvedValue([]);

      await listLiveShows({ format: VideoFormat.SHOPPABLE_VIDEO });

      expect(prisma.liveShow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            format: VideoFormat.SHOPPABLE_VIDEO,
          }),
        })
      );
    });

    it('filters by brand slug or id', async () => {
      (prisma.liveShow.findMany as any).mockResolvedValue([]);

      await listLiveShows({ brand: 'hudson-valley' });

      expect(prisma.liveShow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            brand: {
              OR: [{ slug: 'hudson-valley' }, { id: 'hudson-valley' }],
            },
          }),
        })
      );
    });
  });

  describe('2. getLiveShowById lookup', () => {
    it('retrieves show by id or terrificShowId', async () => {
      (prisma.liveShow.findFirst as any).mockResolvedValue({
        id: 'show-123',
        title: 'Masterclass Live',
        description: 'Cultivator masterclass',
        format: VideoFormat.SHOPPABLE_VIDEO,
        status: ShowStatus.REPLAY,
        scheduledAt: null,
        scheduledEndAt: null,
        startedAt: null,
        endedAt: null,
        thumbnailUrl: '/thumb.jpg',
        embeddingId: 'embed-123',
        terrificShowId: 'terrific-reel-1',
        brand: { id: 'b1', slug: 'gotham', name: 'Gotham' },
        products: [],
      });

      const show = await getLiveShowById('show-123');
      expect(show).not.toBeNull();
      expect(show?.id).toBe('show-123');
      expect(show?.format).toBe(VideoFormat.SHOPPABLE_VIDEO);
    });

    it('returns null when show is not found', async () => {
      (prisma.liveShow.findFirst as any).mockResolvedValue(null);

      const show = await getLiveShowById('non-existent');
      expect(show).toBeNull();
    });
  });

  describe('3. Pinned Product Price Invariant (AC-PRC-01)', () => {
    it('blocks pinning product to show without an Owtlet uniform price (422 PRICE_REQUIRED)', async () => {
      (prisma.liveShow.findUnique as any).mockResolvedValue({
        id: 'show-1',
        title: 'Flower Power Live',
      });

      (prisma.product.findUnique as any).mockResolvedValue({
        id: 'prod-unpriced',
        name: 'Unpriced Strain',
        owtletPrice: null, // No Owtlet uniform price set!
      });

      await expect(
        pinProductToShow('show-1', 'prod-unpriced')
      ).rejects.toThrow('show products must have an Owtlet price set (AC-ADM-01)');
    });

    it('successfully pins product when owtletPrice is present', async () => {
      (prisma.liveShow.findUnique as any).mockResolvedValue({
        id: 'show-1',
        title: 'Flower Power Live',
      });

      (prisma.product.findUnique as any).mockResolvedValue({
        id: 'prod-priced',
        name: 'Gelato 33',
        owtletPrice: 42.0,
      });

      (prisma.showProduct.upsert as any).mockResolvedValue({
        showId: 'show-1',
        productId: 'prod-priced',
        sortOrder: 1,
        product: { id: 'prod-priced', name: 'Gelato 33', slug: 'gelato-33', owtletPrice: 42.0 },
      });

      const pinned = await pinProductToShow('show-1', 'prod-priced', 1);
      expect(pinned.productId).toBe('prod-priced');
      expect(pinned.sortOrder).toBe(1);
    });
  });

  describe('4. Show State Transitions & Cart Hold Recomputation (AC-HOLD-01, T-HOLD-01)', () => {
    it('startShow sets status to LIVE and records startedAt timestamp', async () => {
      (prisma.liveShow.findUnique as any).mockResolvedValue({
        id: 'show-1',
        title: 'Launch Drop',
        status: ShowStatus.SCHEDULED,
      });

      (prisma.liveShow.update as any).mockResolvedValue({
        id: 'show-1',
        status: ShowStatus.LIVE,
        startedAt: new Date(),
      });

      const started = await startShow('show-1');
      expect(started.status).toBe(ShowStatus.LIVE);
      expect(started.startedAt).toBeDefined();
    });

    it('endShow sets status to REPLAY, sets endedAt, and triggers recomputeHeldCarts (AC-HOLD-01)', async () => {
      (prisma.liveShow.findUnique as any).mockResolvedValue({
        id: 'show-1',
        title: 'Launch Drop',
        status: ShowStatus.LIVE,
      });

      (prisma.liveShow.update as any).mockResolvedValue({
        id: 'show-1',
        status: ShowStatus.REPLAY,
        endedAt: new Date(),
      });

      const ended = await endShow('show-1');
      expect(ended.status).toBe(ShowStatus.REPLAY);
      expect(ended.endedAt).toBeDefined();

      // Verifies AC-HOLD-01 / T-HOLD-01 hold recomputation invocation
      expect(recomputeHeldCarts).toHaveBeenCalledWith('show-1');
    });
  });
});

