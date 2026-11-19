import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Decimal } from '@prisma/client/runtime/library';
import { StrainType } from '@prisma/client';

// Mock prisma before importing products service
vi.mock('../server/db', () => {
  return {
    prisma: {
      product: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      coverageZip: {
        findUnique: vi.fn(),
      },
    },
    db: {
      product: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      coverageZip: {
        findUnique: vi.fn(),
      },
    },
  };
});

import { prisma } from '../server/db';
import {
  calculateDistanceMiles,
  listProducts,
  getProductBySlug,
  resolveProduct,
} from '../server/products';

const mockDispensaries = {
  gotham: {
    id: 'disp-gotham-uuid',
    name: 'Gotham Greenery',
    slug: 'gotham-greenery',
    addressLine1: '123 Broadway',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    latitude: new Decimal(40.7501),
    longitude: new Decimal(-73.9996),
    offersPickup: true,
    offersDelivery: true,
    coverageZips: ['10001', '10002', '10003'],
    isActive: true,
  },
  kings: {
    id: 'disp-kings-uuid',
    name: 'Kings County Cannabis Co.',
    slug: 'kings-county',
    addressLine1: '456 Atlantic Ave',
    city: 'Brooklyn',
    state: 'NY',
    zip: '11201',
    latitude: new Decimal(40.6958),
    longitude: new Decimal(-73.9897),
    offersPickup: true,
    offersDelivery: false,
    coverageZips: [],
    isActive: true,
  },
};

const mockProducts = [
  {
    id: 'prod-blue-dream-uuid',
    slug: 'blue-dream-craft-eighth-3-5g',
    name: 'Blue Dream Craft Eighth 3.5g',
    description: 'Legendary sweet berry aroma with balanced uplifting cerebral energy.',
    brandId: 'brand-hvb-uuid',
    categoryId: 'cat-flower-uuid',
    strainId: 'strain-bd-uuid',
    thcPercent: new Decimal(24.5),
    cbdPercent: new Decimal(0.15),
    weightGrams: new Decimal(3.5),
    imageUrls: ['/products/flower-blue-dream.jpg'],
    owtletPrice: new Decimal(50.0), // Standardized Owtlet Price
    sku: 'HVB-BD-35G',
    terrificProductId: 'terrific-prod-blue-dream-35g',
    isActive: true,
    createdAt: new Date('2026-11-01T12:00:00Z'),
    category: { slug: 'flower', name: 'Flower' },
    strain: { name: 'Blue Dream', type: StrainType.HYBRID },
    brand: { slug: 'hudson-valley-botanics', name: 'Hudson Valley Botanics' },
    inventory: [
      {
        id: 'inv-1',
        productId: 'prod-blue-dream-uuid',
        dispensaryId: mockDispensaries.gotham.id,
        price: new Decimal(55.0),
        stockQty: 10,
        dispensary: mockDispensaries.gotham,
      },
      {
        id: 'inv-2',
        productId: 'prod-blue-dream-uuid',
        dispensaryId: mockDispensaries.kings.id,
        price: new Decimal(50.0),
        stockQty: 5,
        dispensary: mockDispensaries.kings,
      },
    ],
  },
  {
    id: 'prod-sour-diesel-uuid',
    slug: 'sour-diesel-pre-roll-1g',
    name: 'Sour Diesel Pre-Roll 1g',
    description: 'Pungent diesel aroma with energizing sativa clarity.',
    brandId: 'brand-gs-uuid',
    categoryId: 'cat-preroll-uuid',
    strainId: 'strain-sd-uuid',
    thcPercent: new Decimal(21.0),
    cbdPercent: null,
    weightGrams: new Decimal(1.0),
    imageUrls: ['/products/preroll-sour-diesel.jpg'],
    owtletPrice: null, // Per-store retail pricing
    sku: 'GS-SD-1G',
    terrificProductId: 'terrific-prod-sour-diesel-1g',
    isActive: true,
    createdAt: new Date('2026-11-02T12:00:00Z'),
    category: { slug: 'pre-rolls', name: 'Pre-Rolls' },
    strain: { name: 'Sour Diesel', type: StrainType.SATIVA },
    brand: { slug: 'gotham-select', name: 'Gotham Select' },
    inventory: [
      {
        id: 'inv-3',
        productId: 'prod-sour-diesel-uuid',
        dispensaryId: mockDispensaries.gotham.id,
        price: new Decimal(18.0),
        stockQty: 0, // out of stock here
        dispensary: mockDispensaries.gotham,
      },
      {
        id: 'inv-4',
        productId: 'prod-sour-diesel-uuid',
        dispensaryId: mockDispensaries.kings.id,
        price: new Decimal(22.0),
        stockQty: 8, // in stock
        dispensary: mockDispensaries.kings,
      },
    ],
  },
];

describe('Products Domain Service (TASK-006, AC-CAT-01/02/03)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateDistanceMiles', () => {
    it('calculates accurate distance between known coordinates', () => {
      // Times Square to Brooklyn Downtown ~ 4.5 miles
      const distance = calculateDistanceMiles(40.758, -73.9855, 40.6928, -73.9872);
      expect(distance).toBeGreaterThan(4.0);
      expect(distance).toBeLessThan(5.0);
    });

    it('returns 0 for identical points', () => {
      const distance = calculateDistanceMiles(40.7128, -74.006, 40.7128, -74.006);
      expect(distance).toBe(0);
    });
  });

  describe('listProducts', () => {
    it('returns catalog products with correct envelope shape and pricing mode', async () => {
      (prisma.product.findMany as any).mockResolvedValue(mockProducts);

      const result = await listProducts({ limit: 10 });
      expect(result).toHaveProperty('items');
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items.length).toBe(2);

      const showProduct = result.items[0];
      expect(showProduct.id).toBe('prod-blue-dream-uuid');
      expect(showProduct.priceMode).toBe('OWTLET');
      expect(showProduct.owtletPrice).toBe('50.00');
      expect(showProduct.fromPrice).toBe('50.00');
      expect(showProduct.availableAtCount).toBe(2);

      const perStoreProduct = result.items[1];
      expect(perStoreProduct.id).toBe('prod-sour-diesel-uuid');
      expect(perStoreProduct.priceMode).toBe('PER_STORE');
      expect(perStoreProduct.owtletPrice).toBeNull();
      expect(perStoreProduct.fromPrice).toBe('22.00'); // Lowest IN-STOCK price ($22 vs $18 out of stock)
      expect(perStoreProduct.availableAtCount).toBe(1);
    });

    it('passes category slug filter to prisma query', async () => {
      (prisma.product.findMany as any).mockResolvedValue([mockProducts[0]]);

      const result = await listProducts({ category: 'flower' });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: { slug: 'flower' },
          }),
        })
      );
      expect(result.items.length).toBe(1);
      expect(result.items[0].category.slug).toBe('flower');
    });

    it('passes strain type filter to prisma query', async () => {
      (prisma.product.findMany as any).mockResolvedValue([mockProducts[1]]);

      await listProducts({ strainType: 'SATIVA' });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            strain: { type: 'SATIVA' },
          }),
        })
      );
    });

    it('passes search query to prisma query across name, description, strain, category and brand', async () => {
      (prisma.product.findMany as any).mockResolvedValue([mockProducts[0]]);

      await listProducts({ q: 'Blue Dream' });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'Blue Dream', mode: 'insensitive' } },
            ]),
          }),
        })
      );
    });

    it('passes brand filter to prisma query', async () => {
      (prisma.product.findMany as any).mockResolvedValue([mockProducts[0]]);

      await listProducts({ brand: 'hudson-valley-botanics' });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            brand: { slug: 'hudson-valley-botanics' },
          }),
        })
      );
    });

    it('supports cursor pagination and calculates nextCursor', async () => {
      // Mock returning 3 items when limit is 2 (indicating next page exists)
      const mockThreeProducts = [
        mockProducts[0],
        mockProducts[1],
        { ...mockProducts[0], id: 'prod-3-uuid' },
      ];
      (prisma.product.findMany as any).mockResolvedValue(mockThreeProducts);

      const page = await listProducts({ limit: 2 });
      expect(page.items.length).toBe(2);
      expect(page.nextCursor).toBe('prod-sour-diesel-uuid');
    });
  });

  describe('getProductBySlug', () => {
    it('returns full product detail with store availability and uniform Owtlet price', async () => {
      (prisma.product.findUnique as any).mockResolvedValue(mockProducts[0]);

      const product = await getProductBySlug('blue-dream-craft-eighth-3-5g');
      expect(product).not.toBeNull();
      expect(product!.slug).toBe('blue-dream-craft-eighth-3-5g');
      expect(product!.priceMode).toBe('OWTLET');
      expect(product!.owtletPrice).toBe('50.00');
      expect(product!.fromPrice).toBe('50.00');
      expect(product!.availability.length).toBe(2);

      // Verify uniform Owtlet price across all stores regardless of inventory price
      expect(product!.availability[0].price).toBe('50.00');
      expect(product!.availability[1].price).toBe('50.00');
    });

    it('evaluates delivery eligibility and distance when zip is supplied', async () => {
      (prisma.product.findUnique as any).mockResolvedValue(mockProducts[0]);
      (prisma.coverageZip.findUnique as any).mockResolvedValue({
        zip: '10001',
        region: 'MANHATTAN',
        latitude: new Decimal(40.7501),
        longitude: new Decimal(-73.9996),
      });

      const product = await getProductBySlug('blue-dream-craft-eighth-3-5g', { zip: '10001' });
      expect(product).not.toBeNull();

      const gotham = product!.availability.find((a) => a.dispensarySlug === 'gotham-greenery');
      expect(gotham).toBeDefined();
      expect(gotham!.deliversToZip).toBe(true);
      expect(gotham!.distanceMiles).toBe(0);

      const kings = product!.availability.find((a) => a.dispensarySlug === 'kings-county');
      expect(kings).toBeDefined();
      expect(kings!.deliversToZip).toBe(false); // Kings County does not offer delivery or cover 10001
      expect(kings!.distanceMiles).toBeGreaterThan(0);
    });

    it('returns null for non-existent product slug', async () => {
      (prisma.product.findUnique as any).mockResolvedValue(null);

      const product = await getProductBySlug('non-existent-product-404');
      expect(product).toBeNull();
    });

    it('returns null for inactive product', async () => {
      (prisma.product.findUnique as any).mockResolvedValue({
        ...mockProducts[0],
        isActive: false,
      });

      const product = await getProductBySlug('inactive-product');
      expect(product).toBeNull();
    });
  });

  describe('resolveProduct (T-MAP-01)', () => {
    it('resolves product by terrificProductId', async () => {
      (prisma.product.findUnique as any)
        .mockResolvedValueOnce(mockProducts[0]) // first call inside resolveProduct
        .mockResolvedValueOnce(mockProducts[0]); // second call inside getProductBySlug

      const product = await resolveProduct({
        terrificProductId: 'terrific-prod-blue-dream-35g',
      });
      expect(product).not.toBeNull();
      expect(product!.name).toContain('Blue Dream');
    });

    it('resolves product by externalId (Terrific webhook shape)', async () => {
      (prisma.product.findUnique as any)
        .mockResolvedValueOnce(mockProducts[0])
        .mockResolvedValueOnce(mockProducts[0]);

      const product = await resolveProduct({
        externalId: 'terrific-prod-blue-dream-35g',
      });
      expect(product).not.toBeNull();
      expect(product!.name).toContain('Blue Dream');
    });

    it('resolves product by sku', async () => {
      (prisma.product.findUnique as any)
        .mockResolvedValueOnce(mockProducts[0])
        .mockResolvedValueOnce(mockProducts[0]);

      const product = await resolveProduct({
        sku: 'HVB-BD-35G',
      });
      expect(product).not.toBeNull();
      expect(product!.name).toContain('Blue Dream');
    });

    it('returns null for unmapped product identifiers', async () => {
      (prisma.product.findUnique as any).mockResolvedValue(null);

      const product = await resolveProduct({
        terrificProductId: 'unmapped-terrific-xyz-999',
      });
      expect(product).toBeNull();
    });
  });
});
