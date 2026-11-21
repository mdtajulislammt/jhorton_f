import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ProductCard } from '@/components/catalog/product-card';
import { StoreAvailabilityList } from '@/components/catalog/store-availability-list';
import { ProductGridSkeleton, ProductDetailSkeleton } from '@/components/catalog/catalog-skeleton';
import { ProductSummaryDto, StoreAvailabilityDto } from '@/types/api.generated';
import { StrainType } from '@/types/api.generated';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/shop',
}));

// ProductCard quick-add uses the cart hook; isolate it from React Query in SSR snapshot tests
vi.mock('@/hooks/useCart', () => ({
  useCart: () => ({ addToCart: vi.fn() }),
}));

const renderClean = (component: React.ReactElement) => {
  return renderToString(component).replace(/<!--.*?-->/g, '');
};

describe('Catalog Components (Friday & Jarvis UI Verification)', () => {
  const mockShowProduct: ProductSummaryDto = {
    id: 'prod-blue-dream',
    slug: 'blue-dream-craft-eighth-3-5g',
    name: 'Blue Dream Craft Eighth 3.5g',
    description: 'Sweet berry aroma with balanced uplifting cerebral energy.',
    category: { slug: 'flower', name: 'Flower' },
    strain: { name: 'Blue Dream', type: StrainType.HYBRID },
    brand: { slug: 'hudson-valley-botanics', name: 'Hudson Valley Botanics' },
    thcPercent: '24.50',
    cbdPercent: '0.15',
    weightGrams: '3.50',
    imageUrls: ['/products/flower-blue-dream.jpg'],
    priceMode: 'OWTLET',
    owtletPrice: '50.00',
    fromPrice: '50.00',
    availableAtCount: 3,
  };

  const mockRetailProduct: ProductSummaryDto = {
    id: 'prod-sour-diesel',
    slug: 'sour-diesel-pre-roll-1g',
    name: 'Sour Diesel Pre-Roll 1g',
    description: 'Classic pungent fuel profile delivering daytime clarity.',
    category: { slug: 'pre-rolls', name: 'Pre-Rolls' },
    strain: { name: 'Sour Diesel', type: StrainType.SATIVA },
    brand: { slug: 'gotham-select', name: 'Gotham Select' },
    thcPercent: '21.00',
    cbdPercent: null,
    weightGrams: '1.00',
    imageUrls: ['/products/preroll-sour-diesel.jpg'],
    priceMode: 'PER_STORE',
    owtletPrice: null,
    fromPrice: '18.00',
    availableAtCount: 2,
  };

  describe('ProductCard', () => {
    it('displays single Owtlet price pill for show products (T-PRC-01)', () => {
      const html = renderClean(<ProductCard product={mockShowProduct} />);
      expect(html).toContain('$50.00');
      expect(html).toContain('Owtlet Price');
      expect(html).toContain('THC 24.5%');
      expect(html).toContain('Available at 3 stores near you');
    });

    it('displays "From $X" for regular retail products with store pricing', () => {
      const html = renderClean(<ProductCard product={mockRetailProduct} />);
      expect(html).toContain('From');
      expect(html).toContain('$18.00');
      expect(html).toContain('Sativa');
      expect(html).toContain('Sour Diesel');
      expect(html).not.toContain('Owtlet Price');
      expect(html).toContain('Available at 2 stores near you');
    });

    it('renders 44px ergonomic quick-add button with Zero Dead Buttons', () => {
      const html = renderClean(<ProductCard product={mockShowProduct} />);
      expect(html).toContain('Add Blue Dream Craft Eighth 3.5g to Cart');
      expect(html).toContain('href="/product/blue-dream-craft-eighth-3-5g"');
      expect(html).toContain('min-h-[44px]');
      expect(html).toContain('active:scale-[0.98]');
    });
  });

  describe('StoreAvailabilityList', () => {
    const mockStores: StoreAvailabilityDto[] = [
      {
        dispensaryId: 'disp-gotham',
        dispensaryName: 'Gotham Greenery',
        dispensarySlug: 'gotham-greenery',
        price: '50.00',
        inStock: true,
        stockQty: 25,
        offersPickup: true,
        offersDelivery: true,
        deliversToZip: true,
        distanceMiles: 1.2,
        addressLine1: '123 Broadway',
        city: 'New York',
        state: 'NY',
        zip: '10001',
      },
      {
        dispensaryId: 'disp-kings',
        dispensaryName: 'Kings County Cannabis Co.',
        dispensarySlug: 'kings-county',
        price: '50.00',
        inStock: false,
        stockQty: 0,
        offersPickup: true,
        offersDelivery: false,
        deliversToZip: false,
        distanceMiles: 3.5,
        addressLine1: '456 Atlantic Ave',
        city: 'Brooklyn',
        state: 'NY',
        zip: '11201',
      },
    ];

    it('renders store list with in-stock and out-of-stock badges', () => {
      const html = renderClean(
        <StoreAvailabilityList
          productSlug="blue-dream-craft-eighth-3-5g"
          initialAvailability={mockStores}
          priceMode="OWTLET"
          owtletPrice="50.00"
        />
      );

      expect(html).toContain('Gotham Greenery');
      expect(html).toContain('In Stock (25)');
      expect(html).toContain('Kings County Cannabis Co.');
      expect(html).toContain('Out of Stock');
    });

    it('displays out-of-stock suggestions directing shoppers to available partner stores', () => {
      const html = renderClean(
        <StoreAvailabilityList
          productSlug="blue-dream-craft-eighth-3-5g"
          initialAvailability={mockStores}
          priceMode="OWTLET"
          owtletPrice="50.00"
        />
      );

      expect(html).toContain('Out of stock at Kings County Cannabis Co. — available at');
      expect(html).toContain('Gotham Greenery');
    });

    it('renders 5-digit NY ZIP delivery checker', () => {
      const html = renderClean(
        <StoreAvailabilityList
          productSlug="blue-dream-craft-eighth-3-5g"
          initialAvailability={mockStores}
          priceMode="OWTLET"
          owtletPrice="50.00"
        />
      );

      expect(html).toContain('Enter 5-digit NY ZIP');
      expect(html).toContain('Check Delivery ZIP');
    });
  });

  describe('Catalog Skeletons (6 UI States Verification)', () => {
    it('renders product grid skeleton cards with pulsing animations', () => {
      const html = renderClean(<ProductGridSkeleton count={4} />);
      expect(html).toContain('data-testid="product-grid-skeleton"');
      expect(html).toContain('animate-pulse');
    });

    it('renders product detail skeleton', () => {
      const html = renderClean(<ProductDetailSkeleton />);
      expect(html).toContain('data-testid="product-detail-skeleton"');
      expect(html).toContain('animate-pulse');
    });
  });
});
