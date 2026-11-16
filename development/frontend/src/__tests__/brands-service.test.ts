import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/server/db', () => ({
  prisma: {
    brand: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/server/products', () => ({
  listProducts: vi.fn(),
}));

vi.mock('@/server/live-shows', () => ({
  listLiveShows: vi.fn(),
}));

import { prisma } from '@/server/db';
import { listProducts } from '@/server/products';
import { listLiveShows } from '@/server/live-shows';
import {
  listActiveBrands,
  getBrandStorefront,
  BrandNotFoundError,
} from '@/server/brands';

describe('Brands Service (docs/08 §12, REQ-F-011, AC-BRD-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockBrand = {
    id: 'brand-uuid-1',
    name: 'Hudson Cannabis',
    slug: 'hudson-cannabis',
    description: 'Premier Hudson Valley sungrown craft cannabis.',
    logoUrl: 'https://cdn.owtlet.com/brands/hudson-logo.png',
    bannerUrl: 'https://cdn.owtlet.com/brands/hudson-banner.png',
    isActive: true,
    sortOrder: 1,
    dispensaries: [
      {
        dispensary: {
          id: 'disp-1',
          name: 'Gotham Greenery',
          slug: 'gotham-greenery',
          zip: '10001',
          city: 'New York',
          offersPickup: true,
          offersDelivery: true,
          isActive: true,
        },
      },
      {
        dispensary: {
          id: 'disp-2',
          name: 'Empire Express',
          slug: 'empire-express',
          zip: '10002',
          city: 'New York',
          offersPickup: false,
          offersDelivery: true,
          isActive: false, // Inactive store should be filtered out
        },
      },
    ],
  };

  describe('listActiveBrands', () => {
    it('returns list of active brands ordered by sortOrder then name', async () => {
      (prisma.brand.findMany as any).mockResolvedValue([
        {
          id: 'brand-1',
          name: 'Hudson Cannabis',
          slug: 'hudson-cannabis',
          description: 'Desc',
          logoUrl: null,
          bannerUrl: null,
          sortOrder: 1,
        },
      ]);

      const result = await listActiveBrands();

      expect(prisma.brand.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logoUrl: true,
          bannerUrl: true,
          sortOrder: true,
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('hudson-cannabis');
    });
  });

  describe('getBrandStorefront', () => {
    it('returns brand metadata, active products, active partner dispensaries, and brand shows', async () => {
      (prisma.brand.findUnique as any).mockResolvedValue(mockBrand);
      (listProducts as any).mockResolvedValue({
        items: [
          {
            id: 'prod-1',
            name: 'Hudson Sour Diesel',
            slug: 'hudson-sour-diesel',
            priceMode: 'PER_STORE',
          },
        ],
        total: 1,
      });
      (listLiveShows as any).mockResolvedValue([
        {
          id: 'show-1',
          title: 'Hudson Harvest Live Drop',
          status: 'SCHEDULED',
        },
      ]);

      const storefront = await getBrandStorefront('hudson-cannabis');

      expect(storefront.brand.name).toBe('Hudson Cannabis');
      expect(storefront.products).toHaveLength(1);
      expect(storefront.dispensaries).toHaveLength(1);
      expect(storefront.dispensaries[0].id).toBe('disp-1');
      expect(storefront.dispensaries[0].name).toBe('Gotham Greenery');
      expect(storefront.shows).toHaveLength(1);
      expect(storefront.shows[0].title).toBe('Hudson Harvest Live Drop');
    });

    it('throws BrandNotFoundError (404) when brand does not exist', async () => {
      (prisma.brand.findUnique as any).mockResolvedValue(null);

      await expect(getBrandStorefront('non-existent')).rejects.toThrow(
        BrandNotFoundError
      );
    });

    it('throws BrandNotFoundError (404) when brand exists but isActive is false', async () => {
      (prisma.brand.findUnique as any).mockResolvedValue({
        ...mockBrand,
        isActive: false,
      });

      await expect(getBrandStorefront('hudson-cannabis')).rejects.toThrow(
        BrandNotFoundError
      );
    });
  });
});
