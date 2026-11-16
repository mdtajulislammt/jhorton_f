import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/server/brands', () => ({
  listActiveBrands: vi.fn(),
  getBrandStorefront: vi.fn(),
  BrandNotFoundError: class BrandNotFoundError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = 'BrandNotFoundError';
    }
  },
}));

import {
  listActiveBrands,
  getBrandStorefront,
  BrandNotFoundError,
} from '@/server/brands';

import { GET as getBrandsHandler } from '@/app/api/brands/route';
import { GET as getBrandStorefrontHandler } from '@/app/api/brands/[slug]/route';

describe('Brand Route Handlers (docs/08 §12, AC-BRD-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockBrandSummary = {
    id: 'brand-1',
    name: 'Hudson Cannabis',
    slug: 'hudson-cannabis',
    description: 'Premier Hudson Valley sungrown craft cannabis.',
    logoUrl: 'https://cdn.owtlet.com/brands/hudson-logo.png',
    bannerUrl: 'https://cdn.owtlet.com/brands/hudson-banner.png',
    sortOrder: 1,
  };

  const mockStorefront = {
    brand: mockBrandSummary,
    products: [{ id: 'prod-1', name: 'Hudson Sour Diesel', slug: 'hudson-sour-diesel' }],
    dispensaries: [{ id: 'disp-1', name: 'Gotham Greenery', slug: 'gotham-greenery', zip: '10001', city: 'New York', offersPickup: true, offersDelivery: true }],
    shows: [{ id: 'show-1', title: 'Hudson Live Drop', status: 'SCHEDULED' }],
  };

  describe('GET /api/brands', () => {
    it('returns 200 with list of active brands', async () => {
      (listActiveBrands as any).mockResolvedValue([mockBrandSummary]);

      const req = new NextRequest('http://localhost:3000/api/brands');
      const res = await getBrandsHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.items).toHaveLength(1);
      expect(json.data.items[0].slug).toBe('hudson-cannabis');
    });
  });

  describe('GET /api/brands/[slug]', () => {
    it('returns 200 with brand storefront data when found', async () => {
      (getBrandStorefront as any).mockResolvedValue(mockStorefront);

      const req = new NextRequest('http://localhost:3000/api/brands/hudson-cannabis');
      const res = await getBrandStorefrontHandler(req, {
        params: { slug: 'hudson-cannabis' },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.brand.name).toBe('Hudson Cannabis');
      expect(json.data.products).toHaveLength(1);
      expect(json.data.dispensaries).toHaveLength(1);
    });

    it('returns 404 NOT_FOUND when brand is missing or inactive', async () => {
      (getBrandStorefront as any).mockRejectedValue(
        new BrandNotFoundError('unknown-brand')
      );

      const req = new NextRequest('http://localhost:3000/api/brands/unknown-brand');
      const res = await getBrandStorefrontHandler(req, {
        params: { slug: 'unknown-brand' },
      });
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('NOT_FOUND');
    });

    it('returns 400 VALIDATION_ERROR when slug is empty', async () => {
      const req = new NextRequest('http://localhost:3000/api/brands/');
      const res = await getBrandStorefrontHandler(req, {
        params: { slug: '' },
      });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });
});

