import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { BrandCard, BrandGrid } from '@/components/modules/brands/BrandCard';
import { BrandHero } from '@/components/modules/brands/BrandHero';
import { BrandProductGrid } from '@/components/modules/brands/BrandProductGrid';

vi.mock('@/hooks/useCart', () => ({
  useCart: () => ({
    addItem: vi.fn(),
    isAdding: false,
    itemCount: 0,
    openCart: vi.fn(),
  }),
}));

const renderClean = (component: React.ReactElement) => {
  return renderToString(component).replace(/<!--.*?-->/g, '');
};

describe('Brand Components (Friday & Jarvis UI - 6 UI States)', () => {
  const mockBrand = {
    id: 'brand-1',
    name: 'Hudson Cannabis',
    slug: 'hudson-cannabis',
    description: 'Premier Hudson Valley sungrown craft cannabis.',
    logoUrl: 'https://cdn.owtlet.com/brands/hudson-logo.png',
    bannerUrl: 'https://cdn.owtlet.com/brands/hudson-banner.png',
    sortOrder: 1,
  };

  const mockDispensaries = [
    {
      id: 'disp-1',
      name: 'Gotham Greenery',
      slug: 'gotham-greenery',
      zip: '10001',
      city: 'New York',
      offersPickup: true,
      offersDelivery: true,
    },
  ];

  const mockProduct = {
    id: 'prod-1',
    slug: 'hudson-sour-diesel',
    name: 'Hudson Sour Diesel',
    description: 'Sungrown flower',
    category: { slug: 'flower', name: 'Flower' },
    strain: { name: 'Sour Diesel', type: 'SATIVA' as const },
    brand: { slug: 'hudson-cannabis', name: 'Hudson Cannabis' },
    thcPercent: '24.5',
    cbdPercent: '0.1',
    weightGrams: '3.5',
    imageUrls: [],
    priceMode: 'PER_STORE' as const,
    owtletPrice: null,
    fromPrice: '45.00',
    availableAtCount: 2,
    inventory: [],
  };

  describe('BrandCard & BrandGrid', () => {
    it('renders BrandCard with brand details and official channel badge', () => {
      const html = renderClean(<BrandCard brand={mockBrand} />);

      expect(html).toContain('Hudson Cannabis');
      expect(html).toContain('Premier Hudson Valley sungrown craft cannabis.');
      expect(html).toContain('href="/brands/hudson-cannabis"');
    });

    it('renders empty state when BrandGrid has 0 brands', () => {
      const html = renderClean(<BrandGrid brands={[]} />);

      expect(html).toContain('No Brand Storefronts Available');
    });
  });

  describe('BrandHero', () => {
    it('renders BrandHero with brand identity and fulfilled by chips', () => {
      const html = renderClean(
        <BrandHero
          brand={mockBrand}
          dispensaries={mockDispensaries}
          productCount={5}
        />
      );

      expect(html).toContain('Hudson Cannabis');
      expect(html).toContain('Official Brand Channel');
      expect(html).toContain('5 Products');
      expect(html).toContain('Fulfilled by 1 Partner Store');
      expect(html).toContain('Gotham Greenery');
    });
  });

  describe('BrandProductGrid', () => {
    it('renders product cards for brand catalog', () => {
      const html = renderClean(
        <BrandProductGrid
          products={[mockProduct]}
          brandSlug="hudson-cannabis"
          brandName="Hudson Cannabis"
        />
      );

      expect(html).toContain('Hudson Sour Diesel');
      expect(html).toContain('From');
      expect(html).toContain('$45.00');
    });

    it('renders empty state when brand has 0 products', () => {
      const html = renderClean(
        <BrandProductGrid
          products={[]}
          brandSlug="hudson-cannabis"
          brandName="Hudson Cannabis"
        />
      );

      expect(html).toContain('No Products Currently Listed');
      expect(html).toContain('Browse Full Catalog');
    });
  });
});
