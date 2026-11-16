import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/server/distribution', () => {
  class MockStoreNotEligibleError extends Error {
    code = 'STORE_NOT_ELIGIBLE';
    dispensaryId: string;
    productId: string;
    constructor(dispensaryId: string, productId: string, reason?: string) {
      super(reason || `Dispensary ${dispensaryId} is not eligible`);
      this.name = 'StoreNotEligibleError';
      this.dispensaryId = dispensaryId;
      this.productId = productId;
    }
  }

  return {
    createDistributionPreview: vi.fn(),
    StoreNotEligibleError: MockStoreNotEligibleError,
  };
});

vi.mock('@/server/dispensaries', () => {
  class MockNoCoverageError extends Error {
    code = 'NO_COVERAGE';
    zip: string;
    constructor(zip: string) {
      super(`Delivery is not available in ZIP ${zip}`);
      this.name = 'NoCoverageError';
      this.zip = zip;
    }
  }

  return {
    NoCoverageError: MockNoCoverageError,
  };
});

vi.mock('@/server/cart', () => {
  class MockCartExpiredError extends Error {
    constructor(message = 'Your cart hold has expired') {
      super(message);
      this.name = 'CartExpiredError';
    }
  }

  return {
    CartExpiredError: MockCartExpiredError,
  };
});

vi.mock('@/server/orders', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/orders')>();

  return {
    ...actual,
    createOrder: vi.fn(),
    getOrderById: vi.fn(),
  };
});

import { createDistributionPreview, StoreNotEligibleError } from '@/server/distribution';
import { NoCoverageError } from '@/server/dispensaries';
import { CartExpiredError } from '@/server/cart';
import {
  createOrder,
  getOrderById,
  PreviewStaleError,
  UnfulfillableItemsError,
  OrderNotFoundError,
  ForbiddenOrderAccessError,
} from '@/server/orders';
import { POST as previewPost } from '@/app/api/orders/preview/route';
import { POST as ordersPost } from '@/app/api/orders/route';
import { GET as ordersGet } from '@/app/api/orders/[id]/route';

describe('Orders Route Handlers (docs/08 §8, ADR-005, ADR-007, ADR-012, AC-SEC-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/orders/preview', () => {
    it('returns 200 with distribution preview and previewHash on valid request', async () => {
      const mockResult = {
        zip: '11201',
        fulfillmentType: 'DELIVERY',
        subOrders: [
          {
            dispensaryId: 'disp-1',
            dispensaryName: 'Gotham Greenery',
            assignment: 'AUTO',
            channelBrand: null,
            isOpenNow: true,
            hoursToday: { opensAt: '10:00', closesAt: '22:00' },
            deliveryHoursToday: { opensAt: '11:00', closesAt: '21:00' },
            distanceMiles: 1.8,
            items: [
              {
                productId: 'prod-1',
                name: 'Blue Dream 3.5g',
                quantity: 1,
                unitPrice: '45.00',
                priceMode: 'OWTLET',
                lineTotal: '45.00',
              },
            ],
            subtotal: '45.00',
            handoffChannel: 'LEAFLY',
            alternatives: [],
          },
        ],
        unfulfillable: [],
        total: '45.00',
        previewHash: 'mock-hash-12345',
      };

      (createDistributionPreview as any).mockResolvedValue(mockResult);

      const req = new NextRequest('http://localhost:3000/api/orders/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'owt_cart=sess-cart-123',
        },
        body: JSON.stringify({
          fulfillmentType: 'DELIVERY',
          zip: '11201',
        }),
      });

      const res = await previewPost(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.previewHash).toBe('mock-hash-12345');
      expect(json.data.subOrders).toHaveLength(1);
    });

    it('returns 400 when cart cookie is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/orders/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fulfillmentType: 'DELIVERY',
          zip: '11201',
        }),
      });

      const res = await previewPost(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when ZIP is missing for DELIVERY fulfillment', async () => {
      const req = new NextRequest('http://localhost:3000/api/orders/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'owt_cart=sess-cart-123',
        },
        body: JSON.stringify({
          fulfillmentType: 'DELIVERY',
        }),
      });

      const res = await previewPost(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 422 NO_COVERAGE when ZIP is outside coverage area', async () => {
      (createDistributionPreview as any).mockRejectedValue(
        new NoCoverageError('90210')
      );

      const req = new NextRequest('http://localhost:3000/api/orders/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'owt_cart=sess-cart-123',
        },
        body: JSON.stringify({
          fulfillmentType: 'DELIVERY',
          zip: '90210',
        }),
      });

      const res = await previewPost(req);
      const json = await res.json();

      expect(res.status).toBe(422);
      expect(json.error.code).toBe('NO_COVERAGE');
    });

    it('returns 422 STORE_NOT_ELIGIBLE when itemOverride targets an ineligible dispensary', async () => {
      (createDistributionPreview as any).mockRejectedValue(
        new StoreNotEligibleError('disp-ineligible', 'prod-1')
      );

      const req = new NextRequest('http://localhost:3000/api/orders/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'owt_cart=sess-cart-123',
        },
        body: JSON.stringify({
          fulfillmentType: 'DELIVERY',
          zip: '11201',
          itemOverrides: [
            {
              productId: 'c1234567-89ab-cdef-0123-456789abcdef',
              dispensaryId: 'd1234567-89ab-cdef-0123-456789abcdef',
            },
          ],
        }),
      });

      const res = await previewPost(req);
      const json = await res.json();

      expect(res.status).toBe(422);
      expect(json.error.code).toBe('STORE_NOT_ELIGIBLE');
    });

    it('returns 410 CART_EXPIRED when cart hold expired', async () => {
      (createDistributionPreview as any).mockRejectedValue(new CartExpiredError());

      const req = new NextRequest('http://localhost:3000/api/orders/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'owt_cart=sess-cart-123',
        },
        body: JSON.stringify({
          fulfillmentType: 'PICKUP',
        }),
      });

      const res = await previewPost(req);
      const json = await res.json();

      expect(res.status).toBe(410);
      expect(json.error.code).toBe('CART_EXPIRED');
    });
  });

  describe('POST /api/orders', () => {
    const validBody = {
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
    };

    it('creates an order with 201 Created on valid input', async () => {
      (createOrder as any).mockResolvedValue({
        isExisting: false,
        order: {
          orderId: 'order-1',
          orderNumber: 'OWT-100245',
          status: 'PENDING',
          subtotal: '45.00',
          subOrders: [
            {
              id: 'sub-1',
              dispensaryId: 'disp-1',
              status: 'PENDING',
              subtotal: '45.00',
            },
          ],
        },
      });

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'owt_cart=sess-cart-123',
        },
        body: JSON.stringify(validBody),
      });

      const res = await ordersPost(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.orderNumber).toBe('OWT-100245');
    });

    it('returns 200 OK idempotently if order was already created for cart', async () => {
      (createOrder as any).mockResolvedValue({
        isExisting: true,
        order: {
          orderId: 'order-1',
          orderNumber: 'OWT-100245',
          status: 'PENDING',
          subtotal: '45.00',
          subOrders: [],
        },
      });

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'owt_cart=sess-cart-123',
        },
        body: JSON.stringify(validBody),
      });

      const res = await ordersPost(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.message).toContain('already created');
    });

    describe('AC-SEC-01: Zero DOB, ID, and Payment Acceptance', () => {
      it('strictly rejects payload containing DOB field with 400 VALIDATION_ERROR', async () => {
        const payloadWithDob = {
          ...validBody,
          dob: '1990-01-01',
        };

        const req = new NextRequest('http://localhost:3000/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: 'owt_cart=sess-cart-123',
          },
          body: JSON.stringify(payloadWithDob),
        });

        const res = await ordersPost(req);
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.error.code).toBe('VALIDATION_ERROR');
        expect(createOrder).not.toHaveBeenCalled();
      });

      it('strictly rejects payload containing ID number with 400 VALIDATION_ERROR', async () => {
        const payloadWithId = {
          ...validBody,
          idNumber: 'DL12345678',
        };

        const req = new NextRequest('http://localhost:3000/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: 'owt_cart=sess-cart-123',
          },
          body: JSON.stringify(payloadWithId),
        });

        const res = await ordersPost(req);
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.error.code).toBe('VALIDATION_ERROR');
        expect(createOrder).not.toHaveBeenCalled();
      });

      it('strictly rejects payload containing payment fields with 400 VALIDATION_ERROR', async () => {
        const payloadWithPayment = {
          ...validBody,
          cardNumber: '4111222233334444',
          cvv: '123',
        };

        const req = new NextRequest('http://localhost:3000/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: 'owt_cart=sess-cart-123',
          },
          body: JSON.stringify(payloadWithPayment),
        });

        const res = await ordersPost(req);
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.error.code).toBe('VALIDATION_ERROR');
        expect(createOrder).not.toHaveBeenCalled();
      });
    });

    it('returns 409 PREVIEW_STALE when stock or pricing changed', async () => {
      (createOrder as any).mockRejectedValue(new PreviewStaleError());

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'owt_cart=sess-cart-123',
        },
        body: JSON.stringify(validBody),
      });

      const res = await ordersPost(req);
      const json = await res.json();

      expect(res.status).toBe(409);
      expect(json.error.code).toBe('PREVIEW_STALE');
    });

    it('returns 422 UNFULFILLABLE_ITEMS when cart contains unfulfillable lines', async () => {
      (createOrder as any).mockRejectedValue(
        new UnfulfillableItemsError([
          {
            productId: 'prod-1',
            name: 'Blue Dream',
            reason: 'NOT_IN_STOCK_FOR_ZIP',
            suggestions: [],
          },
        ])
      );

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'owt_cart=sess-cart-123',
        },
        body: JSON.stringify(validBody),
      });

      const res = await ordersPost(req);
      const json = await res.json();

      expect(res.status).toBe(422);
      expect(json.error.code).toBe('UNFULFILLABLE_ITEMS');
    });
  });

  describe('GET /api/orders/[id]', () => {
    it('returns 200 OK with order details on authorized request', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'OWT-100245',
        status: 'PENDING',
        subtotal: '45.00',
        subOrders: [],
      };

      (getOrderById as any).mockResolvedValue(mockOrder);

      const req = new NextRequest('http://localhost:3000/api/orders/order-1', {
        headers: {
          Cookie: 'owt_cart=sess-cart-123',
        },
      });

      const res = await ordersGet(req, { params: { id: 'order-1' } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.orderNumber).toBe('OWT-100245');
    });

    it('returns 404 NOT_FOUND when order does not exist', async () => {
      (getOrderById as any).mockRejectedValue(new OrderNotFoundError());

      const req = new NextRequest('http://localhost:3000/api/orders/order-missing', {
        headers: {
          Cookie: 'owt_cart=sess-cart-123',
        },
      });

      const res = await ordersGet(req, { params: { id: 'order-missing' } });
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error.code).toBe('NOT_FOUND');
    });

    it('returns 403 FORBIDDEN when user does not have permission to view order', async () => {
      (getOrderById as any).mockRejectedValue(new ForbiddenOrderAccessError());

      const req = new NextRequest('http://localhost:3000/api/orders/order-1', {
        headers: {
          Cookie: 'owt_cart=wrong-session',
        },
      });

      const res = await ordersGet(req, { params: { id: 'order-1' } });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.error.code).toBe('FORBIDDEN');
    });
  });
});

