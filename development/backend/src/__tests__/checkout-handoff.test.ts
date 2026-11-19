import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  HandoffChannel,
  OrderStatus,
  SubOrderStatus,
  FulfillmentType,
} from '@prisma/client';
import { prisma } from '../server/db';
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
} from '../server/checkout-handoff';

vi.mock('../server/db', () => ({
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

describe('NestJS Checkout Handoff Service & Providers (TASK-013, docs/08 §9, ADR-005, T-HND-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RetailerPageProvider', () => {
    const provider = new RetailerPageProvider();

    it('has channel = RETAILER_PAGE', () => {
      expect(provider.channel).toBe(HandoffChannel.RETAILER_PAGE);
    });

    it('interpolates {subOrderId}, {orderId}, and {orderNumber}', () => {
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
  });

  describe('LeaflyProvider', () => {
    const provider = new LeaflyProvider();

    it('builds deep link with leaflyStoreId', () => {
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
  });

  describe('executeCheckoutHandoff', () => {
    const mockOrder = {
      id: 'a0000000-0000-0000-0000-000000000001',
      orderNumber: 'OWT-100245',
      cartId: 'cart-1',
      shopperId: null,
      zip: '10001',
      status: OrderStatus.PENDING,
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
      ],
    };

    it('hands off sub-orders and updates status', async () => {
      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.subOrder.findMany as any).mockResolvedValue([
        { status: SubOrderStatus.HANDED_OFF },
      ]);

      const result = await executeCheckoutHandoff({
        orderId: mockOrder.id,
        session: {
          cartSessionToken: 'valid-cart-token',
        },
      });

      expect(result.handoffs).toHaveLength(1);
      expect(result.handoffs[0].subOrderId).toBe('b0000000-0000-0000-0000-000000000001');
      expect(prisma.subOrder.update).toHaveBeenCalled();
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: mockOrder.id },
        data: { status: OrderStatus.HANDED_OFF },
      });
    });

    it('strictly forbids payment fields in handoff payload', () => {
      const invalid = {
        orderId: 'a0000000-0000-0000-0000-000000000001',
        cvv: '123',
      };
      const res = checkoutHandoffSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });
});

