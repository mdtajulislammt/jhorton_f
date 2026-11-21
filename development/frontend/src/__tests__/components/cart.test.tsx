import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { CartTimer } from '@/components/modules/cart/cart-timer';
import { CartLine } from '@/components/modules/cart/cart-line';
import { CartSkeleton } from '@/components/modules/cart/cart-skeleton';
import { CartDrawer } from '@/components/modules/cart/cart-drawer';
import { CartLineDto } from '@/types/api.generated';
import { ShowStatus } from '@/types/api.generated';

// Mock useCart hook
vi.mock('@/hooks/useCart', () => ({
  useCart: vi.fn(() => ({
    cart: {
      id: 'cart-1',
      sessionToken: 'token-1',
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      lastActivityAt: new Date().toISOString(),
      hold: {
        reason: 'INACTIVITY',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
      items: [
        {
          id: 'item-1',
          productId: 'prod-1',
          slug: 'blue-dream-35g',
          name: 'Blue Dream 3.5g',
          imageUrl: null,
          quantity: 2,
          priceMode: 'OWTLET',
          unitPrice: '45.00',
          fromPrice: '45.00',
          lineTotal: '90.00',
          source: 'catalog',
          channelBrand: null,
          preferredDispensaryId: null,
          strain: { name: 'Blue Dream', type: 'HYBRID' },
          category: { name: 'Flower', slug: 'flower' },
        },
      ],
      itemCount: 2,
      estimatedSubtotal: '90.00',
    },
    isLoading: false,
    isExpired: false,
    itemCount: 2,
    estimatedSubtotal: '90.00',
    isOpen: true,
    closeCart: vi.fn(),
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
    isClearing: false,
  })),
}));

import { useCart } from '@/hooks/useCart';

const renderClean = (component: React.ReactElement) => {
  return renderToString(component).replace(/<!--.*?-->/g, '');
};

describe('Cart UI Components (Friday & Jarvis UI Verification)', () => {
  const mockLineItem: CartLineDto = {
    id: 'item-1',
    productId: 'prod-1',
    slug: 'blue-dream-35g',
    name: 'Blue Dream 3.5g',
    imageUrl: null,
    quantity: 2,
    priceMode: 'OWTLET',
    unitPrice: '45.00',
    fromPrice: '45.00',
    lineTotal: '90.00',
    source: 'terrific_live',
    channelBrand: {
      id: 'brand-1',
      name: 'Grand National',
      slug: 'grand-national',
    },
    preferredDispensaryId: null,
    strain: { name: 'Blue Dream', type: 'HYBRID' },
    category: { name: 'Flower', slug: 'flower' },
  };

  describe('CartTimer', () => {
    it('renders LIVE SHOW HOLD badge when show is LIVE', () => {
      const html = renderClean(
        <CartTimer
          hold={{
            reason: 'LIVE_SHOW',
            liveShowId: 'show-1',
            showStatus: ShowStatus.LIVE,
            showTitle: 'Owtlet Launch Night',
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          }}
        />
      );

      expect(html).toContain('LIVE SHOW HOLD');
      expect(html).toContain('Held until 30 min after show ends');
      expect(html).toContain('Owtlet Launch Night');
    });

    it('renders inactivity countdown timer for standard carts', () => {
      const future = new Date(Date.now() + 25 * 60 * 1000).toISOString();
      const html = renderClean(
        <CartTimer
          hold={{
            reason: 'INACTIVITY',
            expiresAt: future,
          }}
        />
      );

      expect(html).toContain('Cart held for inactivity');
      expect(html).toContain('role="timer"');
    });
  });

  describe('CartLine', () => {
    it('renders product details, uniform price badge, brand channel chip, and stepper', () => {
      const html = renderClean(
        <CartLine
          item={mockLineItem}
          onUpdateQuantity={vi.fn()}
          onRemove={vi.fn()}
        />
      );

      expect(html).toContain('Blue Dream 3.5g');
      expect(html).toContain('Flower');
      expect(html).toContain('Blue Dream (HYBRID)');
      expect(html).toContain('Grand National Storefront');
      expect(html).toContain('$90.00');
      expect(html).toContain('($45.00 each)');
      expect(html).toContain('Uniform Live Show Price');
      expect(html).toContain('2'); // quantity display
    });
  });

  describe('CartSkeleton (Loading State)', () => {
    it('renders loading skeletons without empty screen flash', () => {
      const html = renderClean(<CartSkeleton />);
      expect(html).toContain('role="status"');
      expect(html).toContain('Loading your stash');
    });
  });

  describe('CartDrawer', () => {
    it('renders drawer header, lines, subtotal, and compliance note', () => {
      const html = renderClean(<CartDrawer />);

      expect(html).toContain('Your Stash');
      expect(html).toContain('2 items');
      expect(html).toContain('Blue Dream 3.5g');
      expect(html).toContain('Estimated Subtotal');
      expect(html).toContain('$90.00');
      expect(html).toContain('Proceed to Checkout');
      expect(html).toContain('Partner store fulfillment &amp; 21+ ID verified');
    });

    it('renders empty state when cart has 0 items', () => {
      (useCart as any).mockReturnValueOnce({
        cart: { items: [], itemCount: 0, estimatedSubtotal: '0.00' },
        itemCount: 0,
        isOpen: true,
        isLoading: false,
        isExpired: false,
        closeCart: vi.fn(),
      });

      const html = renderClean(<CartDrawer />);
      expect(html).toContain('Your stash is empty');
      expect(html).toContain('Shop Cannabis Catalog');
    });

    it('renders expired state when isExpired is true', () => {
      (useCart as any).mockReturnValueOnce({
        cart: null,
        itemCount: 0,
        isOpen: true,
        isLoading: false,
        isExpired: true,
        closeCart: vi.fn(),
      });

      const html = renderClean(<CartDrawer />);
      expect(html).toContain('Cart Hold Expired');
      expect(html).toContain('Your 30-minute hold window lapsed');
    });
  });
});
