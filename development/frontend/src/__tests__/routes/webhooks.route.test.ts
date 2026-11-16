import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/webhooks/store-confirmation/route';
import * as confirmModule from '@/server/orders/confirm';
import { SubOrderStatus, OrderStatus } from '@prisma/client';
import { prisma } from '@/server/db';

vi.mock('@/server/db', () => ({
  prisma: {
    subOrder: {
      findUnique: vi.fn(),
    },
  },
}));

function buildPostRequest(
  body: unknown,
  headers: {
    signature?: string;
    timestamp?: string;
    dispensary?: string;
  } = {}
): NextRequest {
  const reqHeaders = new Headers({ 'Content-Type': 'application/json' });
  if (headers.signature) reqHeaders.set('x-owtlet-signature', headers.signature);
  if (headers.timestamp) reqHeaders.set('x-owtlet-timestamp', headers.timestamp);
  if (headers.dispensary) reqHeaders.set('x-owtlet-dispensary', headers.dispensary);

  return new NextRequest('http://localhost:3000/api/webhooks/store-confirmation', {
    method: 'POST',
    headers: reqHeaders,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function buildGetRequest(search: string, acceptHeader?: string): NextRequest {
  const reqHeaders = new Headers();
  if (acceptHeader) reqHeaders.set('accept', acceptHeader);

  return new NextRequest(`http://localhost:3000/api/webhooks/store-confirmation${search}`, {
    method: 'GET',
    headers: reqHeaders,
  });
}

describe('Store Confirmation Webhook Route Handlers (POST & GET /api/webhooks/store-confirmation)', () => {
  const subOrderId = 'b0000000-0000-0000-0000-000000000001';
  const orderId = 'a0000000-0000-0000-0000-000000000001';
  const secret = 'dispensary_test_secret_32bytes_min!';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // POST /api/webhooks/store-confirmation
  // ==========================================================================
  describe('POST /api/webhooks/store-confirmation', () => {
    it('returns 200 OK with confirmed order data on valid HMAC webhook call', async () => {
      const mockResult: confirmModule.StoreConfirmationResult = {
        subOrderId,
        orderId,
        orderNumber: 'OWT-100245',
        status: SubOrderStatus.CONFIRMED,
        orderStatus: OrderStatus.CONFIRMED,
        confirmationRef: 'STORE-A-999',
        confirmationUrl: 'https://store-a.example/orders/999',
        confirmedAt: new Date().toISOString(),
        idempotent: false,
      };

      vi.spyOn(confirmModule, 'processStoreConfirmationWebhook').mockResolvedValue(mockResult);

      const req = buildPostRequest(
        {
          subOrderId,
          status: 'CONFIRMED',
          confirmationRef: 'STORE-A-999',
          confirmationUrl: 'https://store-a.example/orders/999',
        },
        {
          signature: 'sha256=valid_sig',
          timestamp: '1700000000',
          dispensary: 'd0000000-0000-0000-0000-000000000001',
        }
      );

      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe(SubOrderStatus.CONFIRMED);
      expect(json.data.orderStatus).toBe(OrderStatus.CONFIRMED);
      expect(json.data.confirmationRef).toBe('STORE-A-999');
    });

    it('returns 400 VALIDATION_ERROR when JSON body is malformed', async () => {
      const req = new NextRequest('http://localhost:3000/api/webhooks/store-confirmation', {
        method: 'POST',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: 'invalid-json{{{',
      });

      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 VALIDATION_ERROR when confirmationRef is missing on status CONFIRMED', async () => {
      const req = buildPostRequest({
        subOrderId,
        status: 'CONFIRMED',
        // missing confirmationRef
      });

      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 401 INVALID_SIGNATURE on invalid or expired signature', async () => {
      vi.spyOn(confirmModule, 'processStoreConfirmationWebhook').mockRejectedValue(
        new confirmModule.InvalidSignatureError('Invalid HMAC signature')
      );

      const req = buildPostRequest(
        {
          subOrderId,
          status: 'CONFIRMED',
          confirmationRef: 'STORE-A-123',
        },
        {
          signature: 'sha256=bad_sig',
          timestamp: '1700000000',
        }
      );

      const res = await POST(req);
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_SIGNATURE');
    });

    it('returns 404 NOT_FOUND when subOrder does not exist', async () => {
      vi.spyOn(confirmModule, 'processStoreConfirmationWebhook').mockRejectedValue(
        new confirmModule.SubOrderNotFoundError('SubOrder not found')
      );

      const req = buildPostRequest(
        {
          subOrderId,
          status: 'CONFIRMED',
          confirmationRef: 'STORE-A-123',
        },
        {
          signature: 'sha256=sig',
          timestamp: '1700000000',
        }
      );

      const res = await POST(req);
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('NOT_FOUND');
    });

    it('returns 403 FORBIDDEN when dispensary header does not match sub-order', async () => {
      vi.spyOn(confirmModule, 'processStoreConfirmationWebhook').mockRejectedValue(
        new confirmModule.ForbiddenWebhookAccessError('Dispensary mismatch')
      );

      const req = buildPostRequest(
        {
          subOrderId,
          status: 'CONFIRMED',
          confirmationRef: 'STORE-A-123',
        },
        {
          signature: 'sha256=sig',
          timestamp: '1700000000',
          dispensary: 'wrong-dispensary-id',
        }
      );

      const res = await POST(req);
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('returns 409 CONFIRMATION_CONFLICT when conflicting confirmationRef is supplied', async () => {
      vi.spyOn(confirmModule, 'processStoreConfirmationWebhook').mockRejectedValue(
        new confirmModule.ConfirmationConflictError('Conflicting confirmation ref')
      );

      const req = buildPostRequest(
        {
          subOrderId,
          status: 'CONFIRMED',
          confirmationRef: 'STORE-A-NEW-CONFLICTING-REF',
        },
        {
          signature: 'sha256=sig',
          timestamp: '1700000000',
        }
      );

      const res = await POST(req);
      expect(res.status).toBe(409);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('CONFIRMATION_CONFLICT');
    });
  });

  // ==========================================================================
  // GET /api/webhooks/store-confirmation
  // ==========================================================================
  describe('GET /api/webhooks/store-confirmation (Signed Link)', () => {
    it('returns 400 VALIDATION_ERROR when token query param is missing', async () => {
      const req = buildGetRequest('');
      const res = await GET(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 401 INVALID_SIGNATURE on malformed token', async () => {
      const req = buildGetRequest('?token=invalid-token');
      const res = await GET(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_SIGNATURE');
    });

    it('returns 200 OK JSON when valid token is verified', async () => {
      const token = confirmModule.generateSignedConfirmationToken(
        {
          subOrderId,
          status: 'CONFIRMED',
          confirmationRef: 'STORE-A-LINK-1',
        },
        secret
      );

      (prisma.subOrder.findUnique as any).mockResolvedValue({
        id: subOrderId,
        dispensaryId: 'd0000000-0000-0000-0000-000000000001',
        dispensary: {
          id: 'd0000000-0000-0000-0000-000000000001',
          webhookSecret: secret,
        },
      });

      const mockResult: confirmModule.StoreConfirmationResult = {
        subOrderId,
        orderId,
        orderNumber: 'OWT-100245',
        status: SubOrderStatus.CONFIRMED,
        orderStatus: OrderStatus.CONFIRMED,
        confirmationRef: 'STORE-A-LINK-1',
        confirmationUrl: null,
        confirmedAt: new Date().toISOString(),
        idempotent: false,
      };

      vi.spyOn(confirmModule, 'confirmSubOrder').mockResolvedValue(mockResult);

      const req = buildGetRequest(`?token=${token}`);
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe(SubOrderStatus.CONFIRMED);
    });

    it('redirects to /order/[id]?confirmed=true when browser requests HTML with valid token', async () => {
      const token = confirmModule.generateSignedConfirmationToken(
        {
          subOrderId,
          status: 'CONFIRMED',
          confirmationRef: 'STORE-A-LINK-2',
        },
        secret
      );

      (prisma.subOrder.findUnique as any).mockResolvedValue({
        id: subOrderId,
        dispensaryId: 'd0000000-0000-0000-0000-000000000001',
        dispensary: {
          id: 'd0000000-0000-0000-0000-000000000001',
          webhookSecret: secret,
        },
      });

      const mockResult: confirmModule.StoreConfirmationResult = {
        subOrderId,
        orderId,
        orderNumber: 'OWT-100245',
        status: SubOrderStatus.CONFIRMED,
        orderStatus: OrderStatus.CONFIRMED,
        confirmationRef: 'STORE-A-LINK-2',
        confirmationUrl: null,
        confirmedAt: new Date().toISOString(),
      };

      vi.spyOn(confirmModule, 'confirmSubOrder').mockResolvedValue(mockResult);

      const req = buildGetRequest(`?token=${token}`, 'text/html,application/xhtml+xml');
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain(`/order/${orderId}?confirmed=true`);
    });
  });
});

