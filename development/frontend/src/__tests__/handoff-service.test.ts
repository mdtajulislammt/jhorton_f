import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  HandoffChannel,
  OrderStatus,
  SubOrderStatus,
  FulfillmentType,
  AssignmentSource,
} from '@prisma/client';
import { prisma } from '@/server/db';
import {
  retailerPageProvider,
  RetailerPageProvider,
  leaflyProvider,
  LeaflyProvider,
  getHandoffProvider,
  executeCheckoutHandoff,
  checkoutHandoffSchema,
  OrderNotFoundError,
  ForbiddenOrderAccessError,
  SubOrderNotFoundError,
} from '@/server/checkout-handoff';

vi.mock('@/server/db', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    subOrder: {
      update: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      return cb(prisma);
    }),
  },
}));

describe('Checkout Handoff Service & Providers (TASK-013, docs/08 §9, ADR-005, T-HND-01, AC-HND-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RetailerPageProvider', () => {
    const provider = new RetailerPageProvider();

    it('has channel = RETAILER_PAGE', () => {
      expect(provider.channel).toBe(HandoffChannel.RETAILER_PAGE);
    });

    it('interpolates {subOrderId}, {orderId}, and {orderNumber} in handoffUrlTemplate', () => {
      const url = provider.buildUrl({
        subOrder: {
          id: 'sub-order-123',
          orderId: 'order-456',
          orderNumber: 'OWT-100245',
          dispensaryId: 'disp-789',
          subtotal: '45.00',
          fulfillmentType: 'DELIVERY',
        },
        dispensary: {
          id: 'disp-789',
          name: 'Gotham Greenery',
          slug: 'gotham-greenery',
          handoffChannel: HandoffChannel.RETAILER_PAGE,
          handoffUrlTemplate:
            'https://gothamgreenery.ny.retailer.com/order?ref={subOrderId}&order={orderNumber}',
          leaflyStoreId: null,
        },
      });

      expect(url).toBe(
        'https://gothamgreenery.ny.retailer.com/order?ref=sub-order-123&order=OWT-100245'
      );
    });

    it('appends ref query param if template does not have {subOrderId} or {ref}', () => {
      const url = provider.buildUrl({
        subOrder: {
          id: 'sub-order-123',
          orderId: 'order-456',
          orderNumber: 'OWT-100245',
          dispensaryId: 'disp-789',
          subtotal: '45.00',
          fulfillmentType: 'DELIVERY',
        },
        dispensary: {
          id: 'disp-789',
          name: 'Empire Express',
          slug: 'empire-express',
          handoffChannel: HandoffChannel.RETAILER_PAGE,
          handoffUrlTemplate: 'https://empireexpress.delivery/checkout',
          leaflyStoreId: null,
        },
      });

      expect(url).toBe('https://empireexpress.delivery/checkout?ref=sub-order-123');
    });

    it('falls back to default retailer domain when handoffUrlTemplate is empty', () => {
      const url = provider.buildUrl({
        subOrder: {
          id: 'sub-order-999',
          orderId: 'order-456',
          orderNumber: 'OWT-100245',
          dispensaryId: 'disp-789',
          subtotal: '45.00',
          fulfillmentType: 'PICKUP',
        },
        dispensary: {
          id: 'disp-789',
          name: 'Local Store',
          slug: 'local-store',
          handoffChannel: HandoffChannel.RETAILER_PAGE,
          handoffUrlTemplate: null,
          leaflyStoreId: null,
        },
      });

      expect(url).toBe('https://local-store.ny.retailer.com/order?ref=sub-order-999');
    });
  });

  describe('LeaflyProvider', () => {
    const provider = new LeaflyProvider();

    it('has channel = LEAFLY', () => {
      expect(provider.channel).toBe(HandoffChannel.LEAFLY);
    });

    it('builds deep-link stub using leaflyStoreId and subOrderId', () => {
      const url = provider.buildUrl({
        subOrder: {
          id: 'sub-order-leafly-1',
          orderId: 'order-456',
          orderNumber: 'OWT-100245',
          dispensaryId: 'disp-kings',
          subtotal: '60.00',
          fulfillmentType: 'PICKUP',
        },
        dispensary: {
          id: 'disp-kings',
          name: 'Kings County Botanicals',
          slug: 'kings-county',
          handoffChannel: HandoffChannel.LEAFLY,
          handoffUrlTemplate: null,
          leaflyStoreId: 'kings-county-brooklyn',
        },
      });

      expect(url).toBe(
        'https://www.leafly.com/dispensary-list/kings-county-brooklyn?owtlet_ref=sub-order-leafly-1'
      );
    });

    it('builds fallback deep-link stub when leaflyStoreId is missing', () => {
      const url = provider.buildUrl({
        subOrder: {
          id: 'sub-order-leafly-2',
          orderId: 'order-456',
          orderNumber: 'OWT-100245',
          dispensaryId: 'disp-kings',
          subtotal: '60.00',
          fulfillmentType: 'PICKUP',
        },
        dispensary: {
          id: 'disp-kings',
          name: 'Kings County Botanicals',
          slug: 'kings-county',
          handoffChannel: HandoffChannel.LEAFLY,
          handoffUrlTemplate: null,
          leaflyStoreId: null,
        },
      });

      expect(url).toBe(
        'https://www.leafly.com/dispensary-list?owtlet_ref=sub-order-leafly-2'
      );
    });
  });

  describe('Provider Registry', () => {
    it('returns the registered provider for RETAILER_PAGE and LEAFLY', () => {
      expect(getHandoffProvider(HandoffChannel.RETAILER_PAGE)).toBe(retailerPageProvider);
      expect(getHandoffProvider(HandoffChannel.LEAFLY)).toBe(leaflyProvider);
    });
  });

  describe('executeCheckoutHandoff', () => {
    const mockOrder = {
      id: 'a0000000-0000-0000-0000-000000000001',
      orderNumber: 'OWT-100245',
      cartId: 'cart-1',
      shopperId: null,
      zip: '10001',
      status: OrderStatus.PENDING,
      contactFirstName: 'Jane',
      contactLastName: 'Doe',
      contactEmail: 'jane@example.com',
      contactPhone: '2125550199',
      cart: {
        sessionToken: 'valid-cart-token',
      },
      subOrders: [
        {
          id: 'b0000000-0000-0000-0000-000000000001',
          orderId: 'a0000000-0000-0000-0000-000000000001',
          dispensaryId: 'disp-1',
          fulfillmentType: FulfillmentType.DELIVERY,
          status: SubOrderStatus.PENDING,
          handoffChannel: HandoffChannel.RETAILER_PAGE,
          subtotal: 45.0,
          dispensary: {
            id: 'disp-1',
            name: 'Gotham Greenery',
            slug: 'gotham-greenery',
            handoffChannel: HandoffChannel.RETAILER_PAGE,
            handoffUrlTemplate: 'https://gotham.example/order?ref={subOrderId}',
            leaflyStoreId: null,
          },
        },
        {
          id: 'b0000000-0000-0000-0000-000000000002',
          orderId: 'a0000000-0000-0000-0000-000000000001',
          dispensaryId: 'disp-2',
          fulfillmentType: FulfillmentType.PICKUP,
          status: SubOrderStatus.PENDING,
          handoffChannel: HandoffChannel.LEAFLY,
          subtotal: 60.0,
          dispensary: {
            id: 'disp-2',
            name: 'Kings County Botanicals',
            slug: 'kings-county',
            handoffChannel: HandoffChannel.LEAFLY,
            handoffUrlTemplate: null,
            leaflyStoreId: 'kings-county-bk',
          },
        },
      ],
    };

    it('hands off all sub-orders, sets status to HANDED_OFF, and rolls up parent order', async () => {
      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.subOrder.findMany as any).mockResolvedValue([
        { status: SubOrderStatus.HANDED_OFF },
        { status: SubOrderStatus.HANDED_OFF },
      ]);

      const result = await executeCheckoutHandoff({
        orderId: mockOrder.id,
        session: {
          cartSessionToken: 'valid-cart-token',
        },
      });

      expect(result.handoffs).toHaveLength(2);
      expect(result.handoffs[0]).toEqual({
        subOrderId: 'b0000000-0000-0000-0000-000000000001',
        channel: HandoffChannel.RETAILER_PAGE,
        url: 'https://gotham.example/order?ref=b0000000-0000-0000-0000-000000000001',
        dispensaryName: 'Gotham Greenery',
      });
      expect(result.handoffs[1]).toEqual({
        subOrderId: 'b0000000-0000-0000-0000-000000000002',
        channel: HandoffChannel.LEAFLY,
        url: 'https://www.leafly.com/dispensary-list/kings-county-bk?owtlet_ref=b0000000-0000-0000-0000-000000000002',
        dispensaryName: 'Kings County Botanicals',
      });

      // Verify sub-orders updated to HANDED_OFF
      expect(prisma.subOrder.update).toHaveBeenCalledTimes(2);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: mockOrder.id },
        data: { status: OrderStatus.HANDED_OFF },
      });
    });

    it('hands off a single sub-order when subOrderId is provided', async () => {
      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.subOrder.findMany as any).mockResolvedValue([
        { status: SubOrderStatus.HANDED_OFF },
        { status: SubOrderStatus.PENDING },
      ]);

      const result = await executeCheckoutHandoff({
        orderId: mockOrder.id,
        subOrderId: 'b0000000-0000-0000-0000-000000000001',
        session: {
          cartSessionToken: 'valid-cart-token',
        },
      });

      expect(result.handoffs).toHaveLength(1);
      expect(result.handoffs[0].subOrderId).toBe('b0000000-0000-0000-0000-000000000001');
      expect(prisma.subOrder.update).toHaveBeenCalledTimes(1);
    });

    it('throws OrderNotFoundError when order does not exist', async () => {
      (prisma.order.findUnique as any).mockResolvedValue(null);

      await expect(
        executeCheckoutHandoff({
          orderId: 'a0000000-0000-0000-0000-000000000099',
          session: { cartSessionToken: 'any-token' },
        })
      ).rejects.toThrow(OrderNotFoundError);
    });

    it('throws ForbiddenOrderAccessError when session does not match order', async () => {
      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);

      await expect(
        executeCheckoutHandoff({
          orderId: mockOrder.id,
          session: { cartSessionToken: 'mismatched-token' },
        })
      ).rejects.toThrow(ForbiddenOrderAccessError);
    });

    it('throws SubOrderNotFoundError when subOrderId is not in the order', async () => {
      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);

      await expect(
        executeCheckoutHandoff({
          orderId: mockOrder.id,
          subOrderId: 'b0000000-0000-0000-0000-000000000999',
          session: { cartSessionToken: 'valid-cart-token' },
        })
      ).rejects.toThrow(SubOrderNotFoundError);
    });

    it('allows admin session to hand off any order', async () => {
      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.subOrder.findMany as any).mockResolvedValue([
        { status: SubOrderStatus.HANDED_OFF },
        { status: SubOrderStatus.HANDED_OFF },
      ]);

      const result = await executeCheckoutHandoff({
        orderId: mockOrder.id,
        session: { isAdmin: true },
      });

      expect(result.handoffs).toHaveLength(2);
    });
  });

  describe('Zero ID & Zero Payment Invariant (AC-SEC-01, ADR-005, AC-HND-01)', () => {
    it('strictly accepts valid checkout handoff payload', () => {
      const valid = {
        orderId: 'a0000000-0000-0000-0000-000000000001',
        subOrderId: 'b0000000-0000-0000-0000-000000000001',
      };
      const res = checkoutHandoffSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it('strictly rejects any payment fields (cardNumber, cvv, etc.)', () => {
      const invalid = {
        orderId: 'a0000000-0000-0000-0000-000000000001',
        cardNumber: '4111222233334444',
      };
      const res = checkoutHandoffSchema.safeParse(invalid);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.errors[0].message).toContain('Unexpected fields provided');
      }
    });

    it('strictly rejects government ID or DOB fields', () => {
      const invalid = {
        orderId: 'a0000000-0000-0000-0000-000000000001',
        driverLicense: 'NY12345678',
        dob: '1990-01-01',
      };
      const res = checkoutHandoffSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });
});

