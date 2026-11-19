import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CartStatus,
  FulfillmentType,
  OrderStatus,
  SubOrderStatus,
  AssignmentSource,
  HandoffChannel,
  Prisma,
} from '@prisma/client';
import { prisma } from '@/server/db';
import {
  generateOrderNumber,
  rollupOrderStatus,
  createOrder,
  getOrderById,
  PreviewStaleError,
  UnfulfillableItemsError,
  CartEmptyError,
  OrderNotFoundError,
  ForbiddenOrderAccessError,
} from '@/server/orders';
import { CartExpiredError } from '@/server/cart';
import * as previewModule from '@/server/distribution/preview';

vi.mock('@/server/db', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    subOrder: {
      create: vi.fn(),
    },
    orderItem: {
      create: vi.fn(),
    },
    cart: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    shopperAddress: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('Orders Service & Status Rollup (T-ORD-01, docs/06 §3, docs/08 §8.2, §8.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Order Number Generation', () => {
    it('generates an order number starting with OWT- and 6 digits', async () => {
      (prisma.order.findUnique as any).mockResolvedValue(null);

      const orderNumber = await generateOrderNumber();
      expect(orderNumber).toMatch(/^OWT-\d{6}$/);
    });

    it('retries when colliding with an existing order number', async () => {
      // First attempt collides, second succeeds
      (prisma.order.findUnique as any)
        .mockResolvedValueOnce({ id: 'existing-id' })
        .mockResolvedValueOnce(null);

      const orderNumber = await generateOrderNumber();
      expect(orderNumber).toMatch(/^OWT-\d{6}$/);
      expect(prisma.order.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe('Status Roll-up Helper (rollupOrderStatus)', () => {
    it('returns PENDING for empty sub-orders array', () => {
      expect(rollupOrderStatus([])).toBe(OrderStatus.PENDING);
    });

    it('returns CONFIRMED when all sub-orders are CONFIRMED', () => {
      expect(
        rollupOrderStatus([SubOrderStatus.CONFIRMED, SubOrderStatus.CONFIRMED])
      ).toBe(OrderStatus.CONFIRMED);
    });

    it('returns PARTIALLY_CONFIRMED when some (not all) sub-orders are CONFIRMED', () => {
      expect(
        rollupOrderStatus([SubOrderStatus.CONFIRMED, SubOrderStatus.PENDING])
      ).toBe(OrderStatus.PARTIALLY_CONFIRMED);
    });

    it('returns CANCELLED when all sub-orders are CANCELLED or REJECTED', () => {
      expect(
        rollupOrderStatus([SubOrderStatus.CANCELLED, SubOrderStatus.REJECTED])
      ).toBe(OrderStatus.CANCELLED);
    });

    it('returns HANDED_OFF when all sub-orders are HANDED_OFF', () => {
      expect(
        rollupOrderStatus([SubOrderStatus.HANDED_OFF, SubOrderStatus.HANDED_OFF])
      ).toBe(OrderStatus.HANDED_OFF);
    });

    it('returns PENDING when sub-orders are still pending', () => {
      expect(
        rollupOrderStatus([SubOrderStatus.PENDING, SubOrderStatus.PENDING])
      ).toBe(OrderStatus.PENDING);
    });
  });

  describe('Atomic Order Creation (T-ORD-01)', () => {
    const validPreview = {
      zip: '11201',
      fulfillmentType: FulfillmentType.DELIVERY,
      subOrders: [
        {
          dispensaryId: 'disp-1',
          dispensaryName: 'Gotham Greenery',
          fulfillmentType: FulfillmentType.DELIVERY,
          assignment: AssignmentSource.AUTO,
          channelBrandId: null,
          channelBrand: null,
          isOpenNow: true,
          hoursToday: { opensAt: '10:00', closesAt: '22:00' },
          isDeliveringNow: true,
          deliveryHoursToday: { opensAt: '11:00', closesAt: '21:00' },
          distanceMiles: 2.1,
          items: [
            {
              productId: 'prod-1',
              name: 'Blue Dream 3.5g',
              quantity: 1,
              unitPrice: '45.00',
              priceMode: 'OWTLET' as const,
              lineTotal: '45.00',
            },
          ],
          subtotal: '45.00',
          handoffChannel: HandoffChannel.LEAFLY,
          alternatives: [],
        },
      ],
      unfulfillable: [],
      total: '45.00',
      previewHash: 'hash-abc-123',
    };

    const validCart = {
      id: 'cart-1',
      sessionToken: 'sess-cart-1',
      shopperId: null,
      status: CartStatus.ACTIVE,
      lastActivityAt: new Date(),
      liveShowId: null,
      liveShow: null,
      items: [
        {
          id: 'item-1',
          productId: 'prod-1',
          quantity: 1,
          product: { id: 'prod-1', name: 'Blue Dream 3.5g' },
        },
      ],
      order: null,
    };

    it('creates Order + SubOrders + OrderItems inside a transaction and marks cart CHECKED_OUT', async () => {
      (prisma.cart.findFirst as any).mockResolvedValue(validCart);
      (prisma.order.findUnique as any).mockResolvedValue(null);

      vi.spyOn(previewModule, 'createDistributionPreview').mockResolvedValue(validPreview);

      // Mock $transaction executing callback
      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const txMock = {
          order: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({
              id: 'order-1',
              orderNumber: 'OWT-100245',
              status: OrderStatus.PENDING,
              subtotal: new Prisma.Decimal('45.00'),
            }),
          },
          subOrder: {
            create: vi.fn().mockResolvedValue({
              id: 'suborder-1',
              dispensaryId: 'disp-1',
              status: SubOrderStatus.PENDING,
              subtotal: new Prisma.Decimal('45.00'),
            }),
          },
          orderItem: {
            create: vi.fn().mockResolvedValue({}),
          },
          cart: {
            update: vi.fn().mockResolvedValue({}),
          },
          shopperAddress: {
            create: vi.fn(),
          },
        };
        return callback(txMock);
      });

      const result = await createOrder(
        {
          fulfillmentType: 'DELIVERY',
          zip: '11201',
          preferredDispensaryId: null,
          itemOverrides: [],
          contact: {
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
            phone: '2125550123',
          },
          deliveryAddress: {
            line1: '120 Atlantic Ave',
            city: 'Brooklyn',
            state: 'NY',
            zip: '11201',
          },
          saveToProfile: false,
          previewHash: 'hash-abc-123',
        },
        { cartSessionToken: 'sess-cart-1' }
      );

      expect(result.isExisting).toBe(false);
      expect(result.order.orderId).toBe('order-1');
      expect(result.order.orderNumber).toBe('OWT-100245');
      expect(result.order.status).toBe(OrderStatus.PENDING);
      expect(result.order.subOrders).toHaveLength(1);
      expect(result.order.subOrders[0].dispensaryId).toBe('disp-1');
    });

    it('returns existing order idempotently (status 200) if cart was already checked out', async () => {
      const checkedOutCart = {
        ...validCart,
        status: CartStatus.CHECKED_OUT,
        order: {
          id: 'order-existing',
          orderNumber: 'OWT-999999',
          status: OrderStatus.PENDING,
          subtotal: new Prisma.Decimal('45.00'),
          subOrders: [
            {
              id: 'sub-existing',
              dispensaryId: 'disp-1',
              status: SubOrderStatus.PENDING,
              subtotal: new Prisma.Decimal('45.00'),
            },
          ],
        },
      };

      (prisma.cart.findFirst as any).mockResolvedValue(checkedOutCart);

      const result = await createOrder(
        {
          fulfillmentType: 'DELIVERY',
          zip: '11201',
          preferredDispensaryId: null,
          itemOverrides: [],
          contact: {
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
            phone: '2125550123',
          },
          deliveryAddress: {
            line1: '120 Atlantic Ave',
            city: 'Brooklyn',
            state: 'NY',
            zip: '11201',
          },
          saveToProfile: false,
          previewHash: 'hash-abc-123',
        },
        { cartSessionToken: 'sess-cart-1' }
      );

      expect(result.isExisting).toBe(true);
      expect(result.order.orderId).toBe('order-existing');
      expect(result.order.orderNumber).toBe('OWT-999999');
    });

    it('rejects with PreviewStaleError (409) if previewHash changed due to inventory/price shifts', async () => {
      (prisma.cart.findFirst as any).mockResolvedValue(validCart);

      // Re-evaluated preview returns a different hash
      vi.spyOn(previewModule, 'createDistributionPreview').mockResolvedValue({
        ...validPreview,
        previewHash: 'hash-different-due-to-price-change',
      });

      await expect(
        createOrder(
          {
            fulfillmentType: 'DELIVERY',
            zip: '11201',
            preferredDispensaryId: null,
            itemOverrides: [],
            contact: {
              firstName: 'Jane',
              lastName: 'Doe',
              email: 'jane@example.com',
              phone: '2125550123',
            },
            deliveryAddress: {
              line1: '120 Atlantic Ave',
              city: 'Brooklyn',
              state: 'NY',
              zip: '11201',
            },
            saveToProfile: false,
            previewHash: 'hash-abc-123', // Stale hash from earlier preview
          },
          { cartSessionToken: 'sess-cart-1' }
        )
      ).rejects.toThrow(PreviewStaleError);
    });

    it('rejects with UnfulfillableItemsError (422) if re-evaluated preview contains unfulfillable lines', async () => {
      (prisma.cart.findFirst as any).mockResolvedValue(validCart);

      vi.spyOn(previewModule, 'createDistributionPreview').mockResolvedValue({
        ...validPreview,
        unfulfillable: [
          {
            productId: 'prod-1',
            name: 'Blue Dream 3.5g',
            reason: 'NOT_IN_STOCK_FOR_ZIP',
            suggestions: [],
          },
        ],
      });

      await expect(
        createOrder(
          {
            fulfillmentType: 'DELIVERY',
            zip: '11201',
            preferredDispensaryId: null,
            itemOverrides: [],
            contact: {
              firstName: 'Jane',
              lastName: 'Doe',
              email: 'jane@example.com',
              phone: '2125550123',
            },
            deliveryAddress: {
              line1: '120 Atlantic Ave',
              city: 'Brooklyn',
              state: 'NY',
              zip: '11201',
            },
            saveToProfile: false,
            previewHash: 'hash-abc-123',
          },
          { cartSessionToken: 'sess-cart-1' }
        )
      ).rejects.toThrow(UnfulfillableItemsError);
    });

    it('rejects with CartEmptyError (400) if the cart has 0 items', async () => {
      (prisma.cart.findFirst as any).mockResolvedValue({
        ...validCart,
        items: [],
      });

      await expect(
        createOrder(
          {
            fulfillmentType: 'DELIVERY',
            zip: '11201',
            preferredDispensaryId: null,
            itemOverrides: [],
            contact: {
              firstName: 'Jane',
              lastName: 'Doe',
              email: 'jane@example.com',
              phone: '2125550123',
            },
            deliveryAddress: {
              line1: '120 Atlantic Ave',
              city: 'Brooklyn',
              state: 'NY',
              zip: '11201',
            },
            saveToProfile: false,
            previewHash: 'hash-abc-123',
          },
          { cartSessionToken: 'sess-cart-1' }
        )
      ).rejects.toThrow(CartEmptyError);
    });
  });

  describe('Order Retrieval & Authorization (getOrderById)', () => {
    const mockOrder = {
      id: 'order-123',
      orderNumber: 'OWT-123456',
      cartId: 'cart-123',
      shopperId: 'shopper-abc',
      fulfillmentType: FulfillmentType.DELIVERY,
      zip: '11201',
      status: OrderStatus.PENDING,
      subtotal: new Prisma.Decimal('45.00'),
      contactFirstName: 'Jane',
      contactLastName: 'Doe',
      contactEmail: 'jane@example.com',
      contactPhone: '2125550123',
      deliveryLine1: '120 Atlantic Ave',
      deliveryLine2: null,
      deliveryCity: 'Brooklyn',
      deliveryState: 'NY',
      createdAt: new Date('2026-11-16T10:00:00Z'),
      updatedAt: new Date('2026-11-16T10:00:00Z'),
      cart: {
        sessionToken: 'sess-cart-token-123',
      },
      subOrders: [
        {
          id: 'sub-1',
          dispensaryId: 'disp-1',
          fulfillmentType: FulfillmentType.DELIVERY,
          assignment: AssignmentSource.AUTO,
          channelBrandId: null,
          status: SubOrderStatus.PENDING,
          handoffChannel: HandoffChannel.LEAFLY,
          handoffUrl: null,
          handedOffAt: null,
          confirmationRef: null,
          confirmationUrl: null,
          confirmedAt: null,
          subtotal: new Prisma.Decimal('45.00'),
          dispensary: { name: 'Gotham Greenery' },
          items: [
            {
              id: 'it-1',
              productId: 'prod-1',
              name: 'Blue Dream 3.5g',
              quantity: 1,
              unitPrice: new Prisma.Decimal('45.00'),
            },
          ],
        },
      ],
    };

    it('returns full order DTO when cart session matches', async () => {
      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);

      const orderDto = await getOrderById('order-123', {
        cartSessionToken: 'sess-cart-token-123',
      });

      expect(orderDto.id).toBe('order-123');
      expect(orderDto.orderNumber).toBe('OWT-123456');
      expect(orderDto.subOrders).toHaveLength(1);
      expect(orderDto.subOrders[0].dispensaryName).toBe('Gotham Greenery');
      expect(orderDto.contact.email).toBe('jane@example.com');
    });

    it('returns full order DTO when authenticated shopper ID matches', async () => {
      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);

      const orderDto = await getOrderById('order-123', {
        shopperId: 'shopper-abc',
      });

      expect(orderDto.id).toBe('order-123');
    });

    it('throws ForbiddenOrderAccessError (403) when neither cart session nor shopperId matches', async () => {
      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);

      await expect(
        getOrderById('order-123', {
          cartSessionToken: 'wrong-session-token',
          shopperId: 'unrelated-shopper-id',
        })
      ).rejects.toThrow(ForbiddenOrderAccessError);
    });

    it('throws OrderNotFoundError (404) when order does not exist', async () => {
      (prisma.order.findUnique as any).mockResolvedValue(null);

      await expect(getOrderById('order-nonexistent')).rejects.toThrow(
        OrderNotFoundError
      );
    });
  });
});

