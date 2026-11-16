import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { LiveBadge } from '@/components/modules/live/LiveBadge';
import { ShowCard } from '@/components/modules/live/ShowCard';
import { ShowRail } from '@/components/modules/live/ShowRail';
import { PinnedProductRail } from '@/components/modules/live/PinnedProductRail';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/live',
}));

// Mock useCart hook
vi.mock('@/hooks/useCart', () => ({
  useCart: () => ({
    addItem: vi.fn().mockResolvedValue({}),
    isLoading: false,
    itemCount: 1,
  }),
}));

// Mock toast store
vi.mock('@/stores/toast.store', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const renderClean = (component: React.ReactElement) => {
  return renderToString(component).replace(/<!--.*?-->/g, '');
};

describe('Live Shows UI Primitives & Friday Components (TASK-016, AC-LIVE-04)', () => {
  describe('1. LiveBadge component', () => {
    it('renders LIVE NOW with animated pulse when status is LIVE', () => {
      const html = renderClean(<LiveBadge status="LIVE" format="LIVE_SHOW" />);
      expect(html).toContain('LIVE NOW');
      expect(html).toContain('animate-pulse');
    });

    it('renders SHOPPABLE VIDEO when format is SHOPPABLE_VIDEO', () => {
      const html = renderClean(<LiveBadge status="REPLAY" format="SHOPPABLE_VIDEO" />);
      expect(html).toContain('SHOPPABLE VIDEO');
    });

    it('renders REPLAY AVAILABLE when status is REPLAY and format is LIVE_SHOW', () => {
      const html = renderClean(<LiveBadge status="REPLAY" format="LIVE_SHOW" />);
      expect(html).toContain('REPLAY AVAILABLE');
    });

    it('renders UPCOMING DROP when status is SCHEDULED', () => {
      const html = renderClean(<LiveBadge status="SCHEDULED" format="LIVE_SHOW" />);
      expect(html).toContain('UPCOMING DROP');
    });
  });

  describe('2. ShowCard component', () => {
    it('renders show details, brand tag, and Watch Live CTA for live shows', () => {
      const html = renderClean(
        <ShowCard
          id="show-live-1"
          title="Owtlet Live Drop: Sunset Sherbet"
          description="Craft indoor organic flower"
          format="LIVE_SHOW"
          status="LIVE"
          brand={{ slug: 'hudson-valley', name: 'Hudson Valley Botanics' }}
          products={[
            { productId: 'p1', name: 'Sunset Sherbet', owtletPrice: '45.00' },
          ]}
        />
      );

      expect(html).toContain('Owtlet Live Drop: Sunset Sherbet');
      expect(html).toContain('Hudson Valley Botanics');
      expect(html).toContain('Watch Live');
      expect(html).toContain('1 Pinned Product');
      expect(html).toContain('href="/live/show-live-1"');
    });

    it('renders Shop Video CTA and routes to /videos/[id] for shoppable videos', () => {
      const html = renderClean(
        <ShowCard
          id="video-reel-1"
          title="Sour Diesel Terpene Deep-Dive"
          format="SHOPPABLE_VIDEO"
          status="REPLAY"
          products={[]}
        />
      );

      expect(html).toContain('Sour Diesel Terpene Deep-Dive');
      expect(html).toContain('Shop Video');
      expect(html).toContain('href="/videos/video-reel-1"');
    });
  });

  describe('3. ShowRail component (6 UI States)', () => {
    it('renders title, badge, and multiple show cards', () => {
      const html = renderClean(
        <ShowRail
          title="Upcoming Cultivator Broadcasts"
          badgeText="Live Schedule"
          badgeIcon="live"
          shows={[
            {
              id: 's-1',
              title: 'Live Drop 1',
              status: 'SCHEDULED',
              format: 'LIVE_SHOW',
            },
            {
              id: 's-2',
              title: 'Live Drop 2',
              status: 'SCHEDULED',
              format: 'LIVE_SHOW',
            },
          ]}
        />
      );

      expect(html).toContain('Upcoming Cultivator Broadcasts');
      expect(html).toContain('Live Schedule');
      expect(html).toContain('Live Drop 1');
      expect(html).toContain('Live Drop 2');
    });

    it('renders domain-specific empty state when shows array is empty', () => {
      const html = renderClean(
        <ShowRail
          title="Broadcast Drops"
          shows={[]}
          emptyTitle="No broadcasts available"
          emptyDescription="Check back shortly for upcoming craft cannabis drops."
        />
      );

      expect(html).toContain('No broadcasts available');
      expect(html).toContain('Check back shortly for upcoming craft cannabis drops.');
      expect(html).toContain('Browse Full Cannabis Catalog');
    });
  });

  describe('4. PinnedProductRail component (AC-LIVE-04)', () => {
    it('renders pinned products with single Owtlet price and tap-to-cart button', () => {
      const html = renderClean(
        <PinnedProductRail
          liveShowId="show-100"
          source="terrific_video"
          title="Featured Products in this Reel"
          products={[
            {
              productId: 'prod-terpene-1',
              slug: 'sour-diesel-resin',
              name: 'Sour Diesel Live Resin',
              owtletPrice: '50.00',
              categoryName: 'Concentrates',
              strainName: 'Sour Diesel',
            },
          ]}
        />
      );

      expect(html).toContain('Sour Diesel Live Resin');
      expect(html).toContain('Featured Products in this Reel');
      expect(html).toContain('Tap to Cart · $50.00');
      expect(html).toContain('Concentrates');
      expect(html).toContain('Sour Diesel');
    });
  });
});
