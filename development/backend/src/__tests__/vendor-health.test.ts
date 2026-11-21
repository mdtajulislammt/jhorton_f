import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runVendorHealthCheck } from '../server/admin/vendor-health-service';
import { prisma } from '../server/db';

vi.mock('../server/db', () => ({
  prisma: {
    dispensary: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
    },
  },
}));

describe('Vendor Weekly Health Check Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDispensaries = [
    {
      id: 'disp-1',
      name: 'Cannablooms',
      cartBaseUrl: 'https://cannablooms.com',
      isActive: true,
      vendorMappings: [
        { productId: 'prod-1', isAvailable: true },
        { productId: 'prod-2', isAvailable: true },
      ],
    },
    {
      id: 'disp-2',
      name: 'Unreachable Store',
      cartBaseUrl: 'https://unreachable-dispensary-down.com',
      isActive: true,
      vendorMappings: [],
    },
  ];

  const mockActiveProducts = [
    { id: 'prod-1', sku: 'SKU-1' },
    { id: 'prod-2', sku: 'SKU-2' },
    { id: 'prod-3', sku: 'SKU-3' }, // unmapped for disp-1
  ];

  it('detects reachable store with mapping gaps and unreachable stores', async () => {
    vi.mocked(prisma.dispensary.findMany).mockResolvedValue(mockDispensaries as any);
    vi.mocked(prisma.product.findMany).mockResolvedValue(mockActiveProducts as any);
    vi.mocked(prisma.dispensary.update).mockResolvedValue({} as any);

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('cannablooms')) {
        return Promise.resolve({ ok: true, status: 200 });
      }
      return Promise.reject(new Error('Connection refused'));
    });

    const report = await runVendorHealthCheck();

    expect(report.totalChecked).toBe(2);
    expect(report.unreachable).toBe(1);
    expect(report.mappingGaps).toBe(1);

    expect(prisma.dispensary.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'disp-1' },
        data: expect.objectContaining({ healthStatus: 'MAPPING_GAPS' }),
      })
    );

    expect(prisma.dispensary.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'disp-2' },
        data: expect.objectContaining({ healthStatus: 'UNREACHABLE' }),
      })
    );
  });
});
