import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/checkout/handoff/route';
import * as handoffModule from '@/server/checkout-handoff/handoff-service';
import {
  OrderNotFoundError,
  ForbiddenOrderAccessError,
  SubOrderNotFoundError,
  ProviderConfigurationError,
} from '@/server/checkout-handoff/types';
import { HandoffChannel } from '@prisma/client';

function buildRequest(body: unknown, options: { cartToken?: string; shopperToken?: string } = {}): NextRequest {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (options.cartToken) {
    headers.set('cookie', `owt_cart=${options.cartToken}`);
  }
  if (options.shopperToken) {
    const existing = headers.get('cookie') || '';
    headers.set('cookie', existing ? `${existing}; owt_shopper=${options.shopperToken}` : `owt_shopper=${options.shopperToken}`);
  }

  return new NextRequest('http://localhost:3000/api/checkout/handoff', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('POST /api/checkout/handoff Route Handler (TASK-013, docs/08 §9, ADR-005, T-HND-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with handoff URLs on valid request', async () => {
    const mockHandoffResult = {
      handoffs: [
        {
          subOrderId: 'b0000000-0000-0000-0000-000000000001',
          channel: HandoffChannel.RETAILER_PAGE,
          url: 'https://store-a.example/order?ref=b0000000-0000-0000-0000-000000000001',
          dispensaryName: 'Gotham Greenery',
        },
      ],
    };

    vi.spyOn(handoffModule, 'executeCheckoutHandoff').mockResolvedValue(mockHandoffResult);

    const req = buildRequest(
      {
        orderId: 'a0000000-0000-0000-0000-000000000001',
      },
      { cartToken: 'tok-123' }
    );

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toBe('Ready for handoff');
    expect(json.data.handoffs).toHaveLength(1);
    expect(json.data.handoffs[0].url).toBe(
      'https://store-a.example/order?ref=b0000000-0000-0000-0000-000000000001'
    );
  });

  it('returns 400 VALIDATION_ERROR on malformed json', async () => {
    const req = new NextRequest('http://localhost:3000/api/checkout/handoff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json{',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 VALIDATION_ERROR when orderId is missing or not a UUID', async () => {
    const req = buildRequest({ orderId: 'not-a-uuid' });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 VALIDATION_ERROR when forbidden payment or ID fields are passed', async () => {
    const req = buildRequest({
      orderId: 'a0000000-0000-0000-0000-000000000001',
      creditCard: '4111222233334444',
      cvv: '123',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(json.error.message).toContain('Invalid handoff request payload');
  });

  it('returns 404 NOT_FOUND when order does not exist', async () => {
    vi.spyOn(handoffModule, 'executeCheckoutHandoff').mockRejectedValue(
      new OrderNotFoundError('Order not found')
    );

    const req = buildRequest({
      orderId: 'a0000000-0000-0000-0000-000000000099',
    });

    const res = await POST(req);
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('returns 404 SUB_ORDER_NOT_FOUND when subOrderId is not in the order', async () => {
    vi.spyOn(handoffModule, 'executeCheckoutHandoff').mockRejectedValue(
      new SubOrderNotFoundError('Sub-order not found')
    );

    const req = buildRequest({
      orderId: 'a0000000-0000-0000-0000-000000000001',
      subOrderId: 'b0000000-0000-0000-0000-000000000999',
    });

    const res = await POST(req);
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('SUB_ORDER_NOT_FOUND');
  });

  it('returns 403 FORBIDDEN when user does not have permission', async () => {
    vi.spyOn(handoffModule, 'executeCheckoutHandoff').mockRejectedValue(
      new ForbiddenOrderAccessError('Access to order denied')
    );

    const req = buildRequest({
      orderId: 'a0000000-0000-0000-0000-000000000001',
    });

    const res = await POST(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('FORBIDDEN');
  });
});

