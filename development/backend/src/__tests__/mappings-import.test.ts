import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseCsv, importMappingsFromCsv } from '@/server/admin/mappings-service';
import { prisma } from '@/server/db';

vi.mock('@/server/db', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    dispensary: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    vendorProductMapping: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn((fn: any) => fn(prisma)),
  },
}));

describe('Admin Vendor Product Mappings CSV Import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseCsv', () => {
    it('parses basic CSV content correctly', () => {
      const csv = `our_sku,dispensary_slug,vendor_product_id,vendor_variant_id,vendor_sku,is_available
HVB-BD-35G,cannablooms,vp-101,vv-201,vsku-301,true
GS-VAPE-LR-1G,culture-house,vp-102,vv-202,vsku-302,false`;

      const rows = parseCsv(csv);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toEqual({
        our_sku: 'HVB-BD-35G',
        dispensary_slug: 'cannablooms',
        vendor_product_id: 'vp-101',
        vendor_variant_id: 'vv-201',
        vendor_sku: 'vsku-301',
        is_available: 'true',
      });
      expect(rows[1].is_available).toBe('false');
    });

    it('handles quoted values with commas inside quotes', () => {
      const csv = `our_sku,dispensary_slug,vendor_product_id,vendor_variant_id,vendor_sku,is_available
"HVB,BD-35G",cannablooms,"vp,101",vv-201,vsku-301,true`;

      const rows = parseCsv(csv);
      expect(rows).toHaveLength(1);
      expect(rows[0].our_sku).toBe('HVB,BD-35G');
      expect(rows[0].vendor_product_id).toBe('vp,101');
    });
  });

  describe('importMappingsFromCsv', () => {
    const mockProducts = [
      { id: 'prod-1', sku: 'HVB-BD-35G', name: 'Blue Dream Craft Eighth 3.5g' },
      { id: 'prod-2', sku: 'GS-VAPE-LR-1G', name: 'Live Rosin Vape 1g' },
    ];

    const mockDispensaries = [
      { id: 'disp-1', slug: 'cannablooms', name: 'Cannablooms' },
      { id: 'disp-2', slug: 'culture-house', name: 'Culture House' },
    ];

    it('successfully imports valid rows and records created/updated counts', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);
      vi.mocked(prisma.dispensary.findMany).mockResolvedValue(mockDispensaries as any);
      // Let's pretend disp-1 already has prod-1 mapping, but disp-2 does not
      vi.mocked(prisma.vendorProductMapping.findMany).mockResolvedValue([
        { productId: 'prod-1', dispensaryId: 'disp-1' },
      ] as any);
      vi.mocked(prisma.vendorProductMapping.upsert).mockResolvedValue({} as any);

      const csv = `our_sku,dispensary_slug,vendor_product_id,vendor_variant_id,vendor_sku,is_available
HVB-BD-35G,cannablooms,vp-101,vv-201,vsku-301,true
GS-VAPE-LR-1G,culture-house,vp-102,vv-202,vsku-302,true`;

      const report = await importMappingsFromCsv(csv);

      expect(report.totalRows).toBe(2);
      expect(report.failed).toBe(0);
      expect(report.updated).toBe(1); // HVB-BD-35G for disp-1 already existed
      expect(report.created).toBe(1); // GS-VAPE-LR-1G for disp-2 is new
      expect(report.errors).toHaveLength(0);
      expect(prisma.vendorProductMapping.upsert).toHaveBeenCalledTimes(2);
    });

    it('rejects row with invalid SKU and does NOT write any broken rows', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);
      vi.mocked(prisma.dispensary.findMany).mockResolvedValue(mockDispensaries as any);

      const csv = `our_sku,dispensary_slug,vendor_product_id,vendor_variant_id,vendor_sku,is_available
HVB-BD-35G,cannablooms,vp-101,vv-201,vsku-301,true
UNKNOWN-SKU-999,culture-house,vp-102,vv-202,vsku-302,true`;

      const report = await importMappingsFromCsv(csv);

      expect(report.totalRows).toBe(2);
      expect(report.failed).toBe(1);
      expect(report.created).toBe(0);
      expect(report.updated).toBe(0);
      expect(report.errors).toHaveLength(1);
      expect(report.errors[0].error).toContain('Invalid SKU: product with SKU "UNKNOWN-SKU-999" not found');
      // Never partially write a broken row
      expect(prisma.vendorProductMapping.upsert).not.toHaveBeenCalled();
    });

    it('rejects row with unknown dispensary slug and does not write', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);
      vi.mocked(prisma.dispensary.findMany).mockResolvedValue(mockDispensaries as any);

      const csv = `our_sku,dispensary_slug,vendor_product_id,vendor_variant_id,vendor_sku,is_available
HVB-BD-35G,unknown-store-slug,vp-101,vv-201,vsku-301,true`;

      const report = await importMappingsFromCsv(csv);

      expect(report.failed).toBe(1);
      expect(report.created).toBe(0);
      expect(report.errors[0].error).toContain('Unknown dispensary: dispensary with slug "unknown-store-slug" not found');
      expect(prisma.vendorProductMapping.upsert).not.toHaveBeenCalled();
    });

    it('rejects duplicate rows within the same CSV upload and does not write', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);
      vi.mocked(prisma.dispensary.findMany).mockResolvedValue(mockDispensaries as any);

      const csv = `our_sku,dispensary_slug,vendor_product_id,vendor_variant_id,vendor_sku,is_available
HVB-BD-35G,cannablooms,vp-101,vv-201,vsku-301,true
HVB-BD-35G,cannablooms,vp-101-dup,vv-201-dup,vsku-301-dup,false`;

      const report = await importMappingsFromCsv(csv);

      expect(report.failed).toBe(1);
      expect(report.created).toBe(0);
      expect(report.errors[0].error).toContain('Duplicate row in CSV');
      expect(prisma.vendorProductMapping.upsert).not.toHaveBeenCalled();
    });
  });
});

