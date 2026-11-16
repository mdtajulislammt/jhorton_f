import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../server/db';
import {
  listAdminProducts,
  getAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  AdminProductError,
} from '../server/admin/products-service';
import {
  listAdminInventory,
  bulkUpdateAdminInventory,
  AdminInventoryError,
} from '../server/admin/inventory-service';
import {
  listAdminDispensaries,
  getAdminDispensaryById,
  createAdminDispensary,
  updateAdminDispensary,
  AdminDispensaryError,
} from '../server/admin/dispensaries-service';
import {
  listAdminBrands,
  getAdminBrandById,
  createAdminBrand,
  updateAdminBrand,
  assignBrandDispensaries,
  AdminBrandError,
} from '../server/admin/brands-service';
import {
  listAdminOrders,
  updateSubOrderStatus,
  maskEmail,
  maskPhone,
  AdminOrderError,
} from '../server/admin/orders-service';
import {
  listAdminShows,
  createAdminShow,
  updateAdminShow,
  pinProductToShow,
  unpinProductFromShow,
  startShow,
  endShow,
  AdminShowError,
} from '../server/admin/shows-service';
import { SubOrderStatus, OrderStatus } from '@prisma/client';

vi.mock('../server/db', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    inventory: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    dispensary: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    dispensaryHours: {
      upsert: vi.fn(),
    },
    brand: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    brandDispensary: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      count: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    subOrder: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    liveShow: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    showProduct: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((cbOrPromises) => {
      if (typeof cbOrPromises === 'function') {
        return cbOrPromises(prisma);
      }
      return Promise.all(cbOrPromises);
    }),
  },
}));

describe('Admin Domain Services & Invariants (AC-ADM-01, AC-BRD-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Products & Live Pricing Invariants (products-service.ts)', () => {
    it('creates a cannabis product with slug and formatted fields', async () => {
      (prisma.product.findUnique as any).mockResolvedValue(null);
      (prisma.product.create as any).mockResolvedValue({
        id: 'prod-1',
        name: 'Sour Diesel',
        slug: 'sour-diesel',
        categoryId: 'cat-flower',
        owtletPrice: 45.0,
        thcPercent: 28.5,
        isActive: true,
      });

      const result = await createAdminProduct({
        name: 'Sour Diesel',
        categoryId: 'cat-flower',
        owtletPrice: 45.0,
        thcPercent: 28.5,
      });

      expect(result.id).toBe('prod-1');
      expect(result.slug).toBe('sour-diesel');
      expect(result.owtletPrice).toBe(45);
    });

    it('blocks removing Owtlet price if product is pinned in a LIVE or SCHEDULED show (AC-ADM-01)', async () => {
      (prisma.product.findUnique as any).mockResolvedValue({
        id: 'prod-pinned',
        name: 'Blue Dream',
        owtletPrice: 50.0,
        showProducts: [
          {
            show: { id: 'show-1', title: 'Friday Live', status: 'LIVE' },
          },
        ],
      });

      await expect(
        updateAdminProduct('prod-pinned', { owtletPrice: null })
      ).rejects.toThrow('Cannot remove Owtlet price: product is currently pinned in a scheduled or active live show (AC-ADM-01)');
    });

    it('allows updating other product fields when pinned if price remains set', async () => {
      (prisma.product.findUnique as any).mockResolvedValue({
        id: 'prod-pinned',
        name: 'Blue Dream',
        owtletPrice: 50.0,
        showProducts: [
          {
            show: { id: 'show-1', title: 'Friday Live', status: 'LIVE' },
          },
        ],
      });

      (prisma.product.update as any).mockResolvedValue({
        id: 'prod-pinned',
        name: 'Blue Dream Premium',
        owtletPrice: 50.0,
      });

      const updated = await updateAdminProduct('prod-pinned', {
        name: 'Blue Dream Premium',
      });
      expect(updated.name).toBe('Blue Dream Premium');
    });
  });

  describe('2. Per-Store Inventory Service (inventory-service.ts)', () => {
    it('performs bulk inventory updates and preserves non-negative stock counts', async () => {
      (prisma.inventory.upsert as any).mockResolvedValue({
        id: 'inv-1',
        productId: 'prod-1',
        dispensaryId: 'disp-1',
        stockQty: 25,
        price: 48.0,
      });

      const result = await bulkUpdateAdminInventory([
        { productId: 'prod-1', dispensaryId: 'disp-1', stockQty: 25, price: 48.0 },
      ]);

      expect(result.updatedCount).toBe(1);
      expect(result.items[0].stockQty).toBe(25);
    });

    it('rejects inventory bulk update with negative stock quantity', async () => {
      await expect(
        bulkUpdateAdminInventory([
          { productId: 'prod-1', dispensaryId: 'disp-1', stockQty: -5 },
        ])
      ).rejects.toThrow('stockQty must be a non-negative integer');
    });
  });

  describe('3. Dispensaries & Hours Service (dispensaries-service.ts)', () => {
    it('creates dispensary with default operating and delivery hours', async () => {
      (prisma.dispensary.findUnique as any).mockResolvedValue(null);
      (prisma.dispensary.create as any).mockResolvedValue({
        id: 'disp-new',
        name: 'Empire Express',
        slug: 'empire-express',
        addressLine1: '456 Broadway',
        city: 'New York',
        state: 'NY',
        zip: '10012',
        offersPickup: true,
        offersDelivery: true,
        hours: [],
      });

      const created = await createAdminDispensary({
        name: 'Empire Express',
        addressLine1: '456 Broadway',
        city: 'New York',
        zip: '10012',
      });

      expect(created.name).toBe('Empire Express');
    });
  });

  describe('4. Brands & Store Mappings Invariants (brands-service.ts, AC-BRD-01)', () => {
    it('blocks activating a brand that has 0 assigned partner dispensaries (AC-BRD-01)', async () => {
      (prisma.brand.findUnique as any).mockResolvedValue(null);

      // Attempt to create brand with isActive: true and dispensaryIds: []
      await expect(
        createAdminBrand({
          name: 'Gotham Genetics',
          isActive: true,
          dispensaryIds: [],
        })
      ).rejects.toThrow(
        'Brand cannot be activated without at least one assigned partner dispensary (AC-BRD-01)'
      );
    });

    it('creates brand successfully when at least one partner dispensary is assigned', async () => {
      (prisma.brand.findUnique as any).mockResolvedValue(null);
      (prisma.brand.create as any).mockResolvedValue({
        id: 'brd-1',
        name: 'Gotham Genetics',
        slug: 'gotham-genetics',
        isActive: true,
        dispensaries: [
          { dispensary: { id: 'disp-1', name: 'Gotham Greenery' } },
        ],
      });

      const brand = await createAdminBrand({
        name: 'Gotham Genetics',
        isActive: true,
        dispensaryIds: ['disp-1'],
      });

      expect(brand.isActive).toBe(true);
      expect(brand.dispensaries).toHaveLength(1);
    });

    it('blocks unassigning all dispensaries from an active brand', async () => {
      (prisma.brand.findUnique as any).mockResolvedValue({
        id: 'brd-1',
        name: 'Active Brand',
        isActive: true,
      });

      await expect(
        assignBrandDispensaries('brd-1', [])
      ).rejects.toThrow(
        'Cannot remove all dispensaries from an active brand; deactivate brand first or assign at least one dispensary (AC-BRD-01)'
      );
    });
  });

  describe('5. Orders & Status Override (orders-service.ts)', () => {
    it('masks shopper email and phone number for compliant staff review', () => {
      expect(maskEmail('customer@gmail.com')).toBe('c***r@gmail.com');
      expect(maskEmail('edith@owtlet.com')).toBe('e***h@owtlet.com');
      expect(maskPhone('917-555-1234')).toBe('***-***-1234');
      expect(maskPhone(null)).toBe('N/A');
    });

    it('updates sub-order status and rolls up parent order status', async () => {
      (prisma.subOrder.findUnique as any).mockResolvedValue({
        id: 'sub-1',
        orderId: 'ord-1',
        status: SubOrderStatus.PENDING,
        order: { id: 'ord-1' },
      });

      (prisma.subOrder.update as any).mockResolvedValue({
        id: 'sub-1',
        status: SubOrderStatus.CONFIRMED,
      });

      (prisma.subOrder.findMany as any).mockResolvedValue([
        { id: 'sub-1', status: SubOrderStatus.CONFIRMED },
        { id: 'sub-2', status: SubOrderStatus.CONFIRMED },
      ]);

      (prisma.order.update as any).mockResolvedValue({
        id: 'ord-1',
        status: OrderStatus.CONFIRMED,
      });

      const result = await updateSubOrderStatus('sub-1', SubOrderStatus.CONFIRMED);
      expect(result.subOrder.status).toBe(SubOrderStatus.CONFIRMED);
      expect(result.parentOrder.status).toBe(OrderStatus.CONFIRMED);
    });
  });

  describe('6. Live Shows & Product Pinning Invariant (shows-service.ts, AC-ADM-01)', () => {
    it('blocks pinning product to show when product has no Owtlet price set (AC-ADM-01)', async () => {
      (prisma.liveShow.findUnique as any).mockResolvedValue({
        id: 'show-1',
        title: 'Flower Power Live',
      });

      (prisma.product.findUnique as any).mockResolvedValue({
        id: 'prod-unpriced',
        name: 'Unpriced Strain',
        owtletPrice: null, // No Owtlet uniform price set!
      });

      await expect(
        pinProductToShow('show-1', 'prod-unpriced')
      ).rejects.toThrow('show products must have an Owtlet price set (AC-ADM-01)');
    });

    it('pins product to live show successfully when Owtlet price is configured', async () => {
      (prisma.liveShow.findUnique as any).mockResolvedValue({
        id: 'show-1',
        title: 'Flower Power Live',
      });

      (prisma.product.findUnique as any).mockResolvedValue({
        id: 'prod-priced',
        name: 'Gelato 33',
        owtletPrice: 40.0,
      });

      (prisma.showProduct.upsert as any).mockResolvedValue({
        showId: 'show-1',
        productId: 'prod-priced',
        sortOrder: 1,
        product: { id: 'prod-priced', name: 'Gelato 33', owtletPrice: 40.0 },
      });

      const pinned = await pinProductToShow('show-1', 'prod-priced', 1);
      expect(pinned.productId).toBe('prod-priced');
      expect(pinned.product.owtletPrice).toBe(40.0);
    });

    it('starts and ends a live show, transitioning statuses and timestamps', async () => {
      (prisma.liveShow.findUnique as any).mockResolvedValue({
        id: 'show-1',
        title: 'Live Drop',
      });

      (prisma.liveShow.update as any).mockResolvedValueOnce({
        id: 'show-1',
        status: 'LIVE',
        startedAt: new Date(),
      });

      const started = await startShow('show-1');
      expect(started.status).toBe('LIVE');

      (prisma.liveShow.update as any).mockResolvedValueOnce({
        id: 'show-1',
        status: 'REPLAY',
        endedAt: new Date(),
      });

      const ended = await endShow('show-1');
      expect(ended.status).toBe('REPLAY');
    });
  });
});

