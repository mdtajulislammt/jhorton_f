import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncWooProducts } from '../server/admin/woocommerce-sync-service';
import { prisma } from '../server/db';

vi.mock('../server/db', () => ({
  prisma: {
    category: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    brand: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    strain: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    product: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

describe('WooCommerce Product Sync Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockWooResponse = [
    {
      id: 101,
      name: 'Sour Diesel Live Flower',
      slug: 'sour-diesel-live-flower',
      sku: 'SKU-SD-01',
      type: 'simple',
      regular_price: '45.00',
      sale_price: '40.00',
      description: 'Premium Sativa Flower',
      short_description: 'Sativa',
      stock_status: 'instock',
      images: [{ src: 'https://cdn.vendor.com/img1.jpg' }],
      categories: [{ id: 1, name: 'Flower', slug: 'flower' }],
      tags: [{ id: 10, name: 'Gotham Botanicals' }],
      attributes: [
        { name: 'THC', options: ['24.5%'] },
        { name: 'CBD', options: ['0.2%'] },
        { name: 'Weight', options: ['3.5g'] },
        { name: 'Strain', options: ['Sativa'] },
      ],
    },
    {
      id: 102,
      name: 'Unmapped Product Without SKU',
      slug: 'unmapped-no-sku',
      sku: '',
      type: 'simple',
      price: '30.00',
    },
    {
      id: 103,
      name: 'Variable Product Without Variants',
      slug: 'variable-empty',
      sku: 'VAR-EMPTY',
      type: 'variable',
      variations: [],
    },
  ];

  it('correctly maps WooCommerce fields and upserts product by SKU', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockWooResponse,
    } as any);

    vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: 'cat-1', name: 'Flower', slug: 'flower' } as any);
    vi.mocked(prisma.brand.findUnique).mockResolvedValue({ id: 'brand-1', name: 'Gotham Botanicals', slug: 'gotham-botanicals' } as any);
    vi.mocked(prisma.strain.findUnique).mockResolvedValue({ id: 'strain-1', name: 'Sour Diesel Live Flower', slug: 'sour-diesel-live-flower' } as any);
    vi.mocked(prisma.product.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.product.create).mockResolvedValue({ id: 'prod-new' } as any);

    const report = await syncWooProducts({
      woocommerceUrl: 'https://test-woo.com',
      consumerKey: 'ck_test',
      consumerSecret: 'cs_test',
      dryRun: false,
    });

    expect(report.totalProcessed).toBe(3);
    expect(report.created).toBe(1);
    expect(report.skipped).toBe(2); // 1 missing SKU, 1 variable without variations
    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sku: 'SKU-SD-01',
          name: 'Sour Diesel Live Flower',
          owtletPrice: 40.0,
          isActive: true,
          thcPercent: 24.5,
          cbdPercent: 0.2,
          weightGrams: 3.5,
        }),
      })
    );
  });

  it('dry-run mode evaluates changes without modifying database', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [mockWooResponse[0]],
    } as any);

    vi.mocked(prisma.product.findFirst).mockResolvedValue({ id: 'existing-prod' } as any);

    const report = await syncWooProducts({
      woocommerceUrl: 'https://test-woo.com',
      consumerKey: 'ck_test',
      consumerSecret: 'cs_test',
      dryRun: true,
    });

    expect(report.dryRun).toBe(true);
    expect(report.updated).toBe(1);
    expect(prisma.product.create).not.toHaveBeenCalled();
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it('paginates until all products are fetched', async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      sku: `SKU-PAGE1-${i}`,
      name: `Product ${i}`,
      stock_status: 'instock',
    }));
    const page2 = [
      {
        id: 201,
        sku: 'SKU-PAGE2-1',
        name: 'Page 2 Product',
        stock_status: 'instock',
      },
    ];

    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => (callCount === 1 ? page1 : page2),
      });
    });

    vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: 'cat-1' } as any);
    vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

    const report = await syncWooProducts({
      woocommerceUrl: 'https://test-woo.com',
      consumerKey: 'ck_test',
      consumerSecret: 'cs_test',
      dryRun: true,
    });

    expect(callCount).toBe(2);
    expect(report.totalProcessed).toBe(101);
  });

  it('skips products missing SKU and reports them', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        { id: 1, name: 'Product Without SKU', sku: '' },
        { id: 2, name: 'Product With SKU', sku: 'VALID-SKU' },
      ],
    });

    vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

    const report = await syncWooProducts({
      woocommerceUrl: 'https://test-woo.com',
      consumerKey: 'ck_test',
      consumerSecret: 'cs_test',
      dryRun: false,
    });

    expect(report.skipped).toBe(1);
    expect(report.created).toBe(1);
    expect(report.details.some((d) => d.sku === 'NO_SKU' && d.action === 'SKIPPED')).toBe(true);
  });

  it('does not deactivate products if a failure occurs on page 2', async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      sku: `SKU-PAGE1-${i}`,
      name: `Product ${i}`,
      stock_status: 'instock',
    }));

    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => page1,
        });
      }
      return Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });
    });

    vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: 'cat-1' } as any);
    vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

    const report = await syncWooProducts({
      woocommerceUrl: 'https://test-woo.com',
      consumerKey: 'ck_test',
      consumerSecret: 'cs_test',
      dryRun: false,
    });

    expect(report.errors.length).toBeGreaterThan(0);
    // Deactivation should NOT have run
    expect(prisma.product.updateMany).not.toHaveBeenCalled();
  });
});
