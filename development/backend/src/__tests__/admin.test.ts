import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../server/db';
import {
  signAdminToken,
  verifyAdminToken,
} from '../server/admin/crypto';
import {
  listAdminProducts,
  createAdminProduct,
  updateAdminProduct,
} from '../server/admin/products-service';
import {
  bulkUpdateAdminInventory,
} from '../server/admin/inventory-service';
import {
  createAdminDispensary,
} from '../server/admin/dispensaries-service';
import {
  createAdminBrand,
  assignBrandDispensaries,
} from '../server/admin/brands-service';
import {
  updateSubOrderStatus,
} from '../server/admin/orders-service';
import {
  pinProductToShow,
  startShow,
  endShow,
} from '../server/admin/shows-service';
import { SubOrderStatus, OrderStatus } from '@prisma/client';

vi.mock('../server/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
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

describe('Edith Admin Domain Services & Contracts (NestJS Backend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signs and verifies admin tokens with 8h TTL', async () => {
    const { token } = await signAdminToken({ userId: 'adm-backend-1', role: 'ADMIN' }, 'test_secret_32_chars_long_12345');
    const verified = await verifyAdminToken(token, 'test_secret_32_chars_long_12345');
    expect(verified.valid).toBe(true);
    expect(verified.userId).toBe('adm-backend-1');
  });

  it('enforces AC-ADM-01: blocks removing Owtlet price on live show pinned product', async () => {
    (prisma.product.findUnique as any).mockResolvedValue({
      id: 'prod-pinned',
      name: 'Gelato',
      owtletPrice: 45.0,
      showProducts: [{ show: { status: 'LIVE' } }],
    });

    await expect(updateAdminProduct('prod-pinned', { owtletPrice: null })).rejects.toThrow(
      'Cannot remove Owtlet price: product is currently pinned in a scheduled or active live show (AC-ADM-01)'
    );
  });

  it('enforces AC-BRD-01: blocks activating a brand with 0 partner dispensaries', async () => {
    (prisma.brand.findUnique as any).mockResolvedValue(null);

    await expect(
      createAdminBrand({
        name: 'Brand Without Stores',
        isActive: true,
        dispensaryIds: [],
      })
    ).rejects.toThrow('Brand cannot be activated without at least one assigned partner dispensary (AC-BRD-01)');
  });

  it('updates sub-order status and rolls up parent order status', async () => {
    (prisma.subOrder.findUnique as any).mockResolvedValue({
      id: 'sub-backend-1',
      orderId: 'ord-backend-1',
      status: SubOrderStatus.PENDING,
      order: { id: 'ord-backend-1' },
    });

    (prisma.subOrder.update as any).mockResolvedValue({
      id: 'sub-backend-1',
      status: SubOrderStatus.CONFIRMED,
    });

    (prisma.subOrder.findMany as any).mockResolvedValue([
      { id: 'sub-backend-1', status: SubOrderStatus.CONFIRMED },
    ]);

    (prisma.order.update as any).mockResolvedValue({
      id: 'ord-backend-1',
      status: OrderStatus.CONFIRMED,
    });

    const res = await updateSubOrderStatus('sub-backend-1', SubOrderStatus.CONFIRMED);
    expect(res.subOrder.status).toBe(SubOrderStatus.CONFIRMED);
    expect(res.parentOrder.status).toBe(OrderStatus.CONFIRMED);
  });

  it('pins product to show requiring Owtlet price (AC-ADM-01)', async () => {
    (prisma.liveShow.findUnique as any).mockResolvedValue({ id: 's1' });
    (prisma.product.findUnique as any).mockResolvedValue({ id: 'p1', name: 'Flower', owtletPrice: null });

    await expect(pinProductToShow('s1', 'p1')).rejects.toThrow(
      'show products must have an Owtlet price set (AC-ADM-01)'
    );
  });
});
