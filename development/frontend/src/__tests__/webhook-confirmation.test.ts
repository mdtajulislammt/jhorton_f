import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubOrderStatus, OrderStatus, FulfillmentType, AssignmentSource, HandoffChannel } from '@prisma/client';
import { prisma } from '@/server/db';
import {
  generateWebhookSignature,
  verifyWebhookSignature,
  generateSignedConfirmationToken,
  verifySignedConfirmationToken,
  confirmSubOrder,
  processStoreConfirmationWebhook,
  InvalidSignatureError,
  SubOrderNotFoundError,
  ForbiddenWebhookAccessError,
  ConfirmationConflictError,
} from '@/server/orders/confirm';

vi.mock('@/server/db', () => ({
  prisma: {
    subOrder: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    order: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('Dispensary Confirmation Webhook (AC-CNF-01, T-WH-01, docs/08 §10)', () => {
  const secret = 'dispensary_test_secret_32bytes_min!';
  const subOrderId = 'b0000000-0000-0000-0000-000000000001';
  const orderId = 'a0000000-0000-0000-0000-000000000001';
  const dispensaryId = 'd0000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // 1. HMAC Signature & Timestamp Verification
  // ==========================================================================
  describe('HMAC-SHA256 & Timestamp Verification', () => {
    it('verifies valid HMAC signature with unix seconds timestamp', () => {
      const rawBody = JSON.stringify({
        subOrderId,
        status: 'CONFIRMED',
        confirmationRef: 'STORE-A-12345',
      });
      const nowSeconds = Math.floor(Date.now() / 1000);
      const signature = generateWebhookSignature(rawBody, nowSeconds, secret);

      const result = verifyWebhookSignature({
        rawBody,
        signatureHeader: signature,
        timestampHeader: String(nowSeconds),
        secret,
      });

      expect(result.valid).toBe(true);
    });

    it('verifies signature without sha256= prefix', () => {
      const rawBody = '{"test":true}';
      const nowSeconds = Math.floor(Date.now() / 1000);
      const signature = generateWebhookSignature(rawBody, nowSeconds, secret).replace('sha256=', '');

      const result = verifyWebhookSignature({
        rawBody,
        signatureHeader: signature,
        timestampHeader: String(nowSeconds),
        secret,
      });

      expect(result.valid).toBe(true);
    });

    it('rejects tampered raw body', () => {
      const originalBody = '{"test":true}';
      const tamperedBody = '{"test":false}';
      const nowSeconds = Math.floor(Date.now() / 1000);
      const signature = generateWebhookSignature(originalBody, nowSeconds, secret);

      const result = verifyWebhookSignature({
        rawBody: tamperedBody,
        signatureHeader: signature,
        timestampHeader: String(nowSeconds),
        secret,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid HMAC signature');
    });

    it('rejects invalid secret', () => {
      const rawBody = '{"test":true}';
      const nowSeconds = Math.floor(Date.now() / 1000);
      const signature = generateWebhookSignature(rawBody, nowSeconds, 'wrong_secret');

      const result = verifyWebhookSignature({
        rawBody,
        signatureHeader: signature,
        timestampHeader: String(nowSeconds),
        secret,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid HMAC signature');
    });

    it('rejects timestamp older than 5 minutes (replay protection)', () => {
      const rawBody = '{"test":true}';
      const pastSeconds = Math.floor(Date.now() / 1000) - 305; // 5m 5s ago
      const signature = generateWebhookSignature(rawBody, pastSeconds, secret);

      const result = verifyWebhookSignature({
        rawBody,
        signatureHeader: signature,
        timestampHeader: String(pastSeconds),
        secret,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('outside 5-minute replay window');
    });

    it('rejects future timestamp outside 5 minutes', () => {
      const rawBody = '{"test":true}';
      const futureSeconds = Math.floor(Date.now() / 1000) + 310;
      const signature = generateWebhookSignature(rawBody, futureSeconds, secret);

      const result = verifyWebhookSignature({
        rawBody,
        signatureHeader: signature,
        timestampHeader: String(futureSeconds),
        secret,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('outside 5-minute replay window');
    });

    it('rejects missing signature or timestamp headers', () => {
      const rawBody = '{"test":true}';
      const resultNoSig = verifyWebhookSignature({
        rawBody,
        signatureHeader: null,
        timestampHeader: '1700000000',
        secret,
      });
      expect(resultNoSig.valid).toBe(false);

      const resultNoTs = verifyWebhookSignature({
        rawBody,
        signatureHeader: 'some_sig',
        timestampHeader: null,
        secret,
      });
      expect(resultNoTs.valid).toBe(false);
    });

    it('rejects non-numeric timestamp', () => {
      const rawBody = '{"test":true}';
      const result = verifyWebhookSignature({
        rawBody,
        signatureHeader: 'sig',
        timestampHeader: 'not-a-number',
        secret,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid X-Owtlet-Timestamp header');
    });
  });

  // ==========================================================================
  // 2. Signed Token Link (GET Variant)
  // ==========================================================================
  describe('Signed Token Links (GET /api/webhooks/store-confirmation?token=...)', () => {
    it('generates and verifies a signed confirmation token', () => {
      const token = generateSignedConfirmationToken(
        {
          subOrderId,
          status: 'CONFIRMED',
          confirmationRef: 'STORE-A-LINK-99',
          confirmationUrl: 'https://store-a.example/orders/99',
          expiresInSeconds: 3600,
        },
        secret
      );

      const verified = verifySignedConfirmationToken(token, secret);
      expect(verified.valid).toBe(true);
      expect(verified.payload?.subOrderId).toBe(subOrderId);
      expect(verified.payload?.status).toBe('CONFIRMED');
      expect(verified.payload?.confirmationRef).toBe('STORE-A-LINK-99');
      expect(verified.payload?.confirmationUrl).toBe('https://store-a.example/orders/99');
    });

    it('rejects expired signed token', () => {
      const token = generateSignedConfirmationToken(
        {
          subOrderId,
          status: 'CONFIRMED',
          confirmationRef: 'STORE-A-EXPIRED',
          expiresInSeconds: -10, // already expired
        },
        secret
      );

      const verified = verifySignedConfirmationToken(token, secret);
      expect(verified.valid).toBe(false);
      expect(verified.error).toBe('Confirmation link has expired');
    });

    it('rejects signed token with wrong secret', () => {
      const token = generateSignedConfirmationToken(
        {
          subOrderId,
          status: 'CONFIRMED',
          confirmationRef: 'STORE-A-100',
        },
        secret
      );

      const verified = verifySignedConfirmationToken(token, 'other_secret');
      expect(verified.valid).toBe(false);
      expect(verified.error).toBe('Invalid token signature');
    });

    it('rejects malformed token structure', () => {
      const verified = verifySignedConfirmationToken('invalid.token.structure.extra', secret);
      expect(verified.valid).toBe(false);
      expect(verified.error).toBe('Invalid token structure');
    });
  });

  // ==========================================================================
  // 3. SubOrder Confirmation Domain Logic & Roll-Up
  // ==========================================================================
  describe('confirmSubOrder Domain Service', () => {
    const mockDispensary = {
      id: dispensaryId,
      name: 'Gotham Greenery',
      slug: 'gotham-greenery',
      webhookSecret: secret,
    };

    const createMockSubOrder = (status: SubOrderStatus = SubOrderStatus.HANDED_OFF, confRef: string | null = null) => ({
      id: subOrderId,
      orderId,
      dispensaryId,
      fulfillmentType: FulfillmentType.DELIVERY,
      assignment: AssignmentSource.AUTO,
      channelBrandId: null,
      status,
      handoffChannel: HandoffChannel.RETAILER_PAGE,
      handoffUrl: 'https://store-a.example/order?ref=' + subOrderId,
      handedOffAt: new Date(),
      confirmationRef: confRef,
      confirmationUrl: null,
      confirmedAt: confRef ? new Date() : null,
      subtotal: { toFixed: () => '45.00' },
      dispensary: mockDispensary,
      order: {
        id: orderId,
        orderNumber: 'OWT-100245',
        status: OrderStatus.HANDED_OFF as OrderStatus,
        subOrders: [
          { id: subOrderId, status },
        ],
      },
    });

    it('confirms a single sub-order and rolls up parent order to CONFIRMED', async () => {
      const mockSub = createMockSubOrder(SubOrderStatus.HANDED_OFF);
      (prisma.subOrder.findUnique as any).mockResolvedValue(mockSub);

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          subOrder: {
            update: vi.fn().mockResolvedValue({
              ...mockSub,
              status: SubOrderStatus.CONFIRMED,
              confirmationRef: 'STORE-A-999',
              confirmationUrl: 'https://store-a.example/orders/999',
              confirmedAt: new Date(),
            }),
            findMany: vi.fn().mockResolvedValue([
              { id: subOrderId, status: SubOrderStatus.HANDED_OFF },
            ]),
          },
          order: {
            update: vi.fn().mockResolvedValue({
              id: orderId,
              orderNumber: 'OWT-100245',
              status: OrderStatus.CONFIRMED,
            }),
          },
        };
        return callback(tx);
      });

      const result = await confirmSubOrder({
        subOrderId,
        status: 'CONFIRMED',
        confirmationRef: 'STORE-A-999',
        confirmationUrl: 'https://store-a.example/orders/999',
      });

      expect(result.subOrderId).toBe(subOrderId);
      expect(result.status).toBe(SubOrderStatus.CONFIRMED);
      expect(result.orderStatus).toBe(OrderStatus.CONFIRMED);
      expect(result.confirmationRef).toBe('STORE-A-999');
      expect(result.idempotent).toBe(false);
    });

    it('rolls up parent order to PARTIALLY_CONFIRMED when multi-store order has 1 confirmed and 1 handed off', async () => {
      const mockSub = createMockSubOrder(SubOrderStatus.HANDED_OFF);
      const siblingSubOrderId = 'b0000000-0000-0000-0000-000000000002';
      mockSub.order.subOrders = [
        { id: subOrderId, status: SubOrderStatus.HANDED_OFF },
        { id: siblingSubOrderId, status: SubOrderStatus.HANDED_OFF },
      ];

      (prisma.subOrder.findUnique as any).mockResolvedValue(mockSub);

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          subOrder: {
            update: vi.fn().mockResolvedValue({
              ...mockSub,
              status: SubOrderStatus.CONFIRMED,
              confirmationRef: 'STORE-A-999',
              confirmedAt: new Date(),
            }),
            findMany: vi.fn().mockResolvedValue([
              { id: subOrderId, status: SubOrderStatus.HANDED_OFF },
              { id: siblingSubOrderId, status: SubOrderStatus.HANDED_OFF },
            ]),
          },
          order: {
            update: vi.fn().mockResolvedValue({
              id: orderId,
              orderNumber: 'OWT-100245',
              status: OrderStatus.PARTIALLY_CONFIRMED,
            }),
          },
        };
        return callback(tx);
      });

      const result = await confirmSubOrder({
        subOrderId,
        status: 'CONFIRMED',
        confirmationRef: 'STORE-A-999',
      });

      expect(result.status).toBe(SubOrderStatus.CONFIRMED);
      expect(result.orderStatus).toBe(OrderStatus.PARTIALLY_CONFIRMED);
    });

    it('rolls up parent order to CANCELLED when all sub-orders are rejected', async () => {
      const mockSub = createMockSubOrder(SubOrderStatus.HANDED_OFF);
      (prisma.subOrder.findUnique as any).mockResolvedValue(mockSub);

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          subOrder: {
            update: vi.fn().mockResolvedValue({
              ...mockSub,
              status: SubOrderStatus.REJECTED,
              confirmedAt: null,
            }),
            findMany: vi.fn().mockResolvedValue([
              { id: subOrderId, status: SubOrderStatus.HANDED_OFF },
            ]),
          },
          order: {
            update: vi.fn().mockResolvedValue({
              id: orderId,
              orderNumber: 'OWT-100245',
              status: OrderStatus.CANCELLED,
            }),
          },
        };
        return callback(tx);
      });

      const result = await confirmSubOrder({
        subOrderId,
        status: 'REJECTED',
      });

      expect(result.status).toBe(SubOrderStatus.REJECTED);
      expect(result.orderStatus).toBe(OrderStatus.CANCELLED);
    });

    it('is idempotent on repeated identical confirmation (same subOrderId and confirmationRef)', async () => {
      const mockSub = createMockSubOrder(SubOrderStatus.CONFIRMED, 'STORE-A-DUPLICATE');
      mockSub.order.status = OrderStatus.CONFIRMED;
      (prisma.subOrder.findUnique as any).mockResolvedValue(mockSub);

      const result = await confirmSubOrder({
        subOrderId,
        status: 'CONFIRMED',
        confirmationRef: 'STORE-A-DUPLICATE',
      });

      expect(result.idempotent).toBe(true);
      expect(result.status).toBe(SubOrderStatus.CONFIRMED);
      expect(result.confirmationRef).toBe('STORE-A-DUPLICATE');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws ConfirmationConflictError (409) when already confirmed sub-order receives a different confirmationRef', async () => {
      const mockSub = createMockSubOrder(SubOrderStatus.CONFIRMED, 'STORE-A-ORIGINAL');
      (prisma.subOrder.findUnique as any).mockResolvedValue(mockSub);

      await expect(
        confirmSubOrder({
          subOrderId,
          status: 'CONFIRMED',
          confirmationRef: 'STORE-A-DIFFERENT',
        })
      ).rejects.toThrow(ConfirmationConflictError);
    });

    it('throws ConfirmationConflictError (409) when trying to reject an already confirmed sub-order', async () => {
      const mockSub = createMockSubOrder(SubOrderStatus.CONFIRMED, 'STORE-A-ORIGINAL');
      (prisma.subOrder.findUnique as any).mockResolvedValue(mockSub);

      await expect(
        confirmSubOrder({
          subOrderId,
          status: 'REJECTED',
        })
      ).rejects.toThrow(ConfirmationConflictError);
    });

    it('throws SubOrderNotFoundError (404) when subOrderId does not exist', async () => {
      (prisma.subOrder.findUnique as any).mockResolvedValue(null);

      await expect(
        confirmSubOrder({
          subOrderId: 'b0000000-0000-0000-0000-000000000999',
          status: 'CONFIRMED',
          confirmationRef: 'STORE-A-404',
        })
      ).rejects.toThrow(SubOrderNotFoundError);
    });

    it('throws ForbiddenWebhookAccessError (403) when dispensary header does not match sub-order dispensary', async () => {
      const mockSub = createMockSubOrder();
      (prisma.subOrder.findUnique as any).mockResolvedValue(mockSub);

      await expect(
        confirmSubOrder({
          subOrderId,
          status: 'CONFIRMED',
          confirmationRef: 'STORE-A-403',
          expectedDispensaryId: 'mismatched-dispensary-uuid',
        })
      ).rejects.toThrow(ForbiddenWebhookAccessError);
    });
  });

  // ==========================================================================
  // 4. processStoreConfirmationWebhook Integration
  // ==========================================================================
  describe('processStoreConfirmationWebhook', () => {
    it('verifies signature with subOrder.dispensary.webhookSecret and executes confirmation', async () => {
      const mockSub = {
        id: subOrderId,
        dispensaryId,
        dispensary: {
          id: dispensaryId,
          slug: 'gotham-greenery',
          webhookSecret: secret,
        },
        order: {
          id: orderId,
          orderNumber: 'OWT-100245',
          status: OrderStatus.CONFIRMED,
          subOrders: [{ id: subOrderId, status: SubOrderStatus.CONFIRMED }],
        },
        status: SubOrderStatus.HANDED_OFF,
        confirmationRef: null,
      };

      (prisma.subOrder.findUnique as any).mockResolvedValue(mockSub);

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          subOrder: {
            update: vi.fn().mockResolvedValue({
              ...mockSub,
              status: SubOrderStatus.CONFIRMED,
              confirmationRef: 'STORE-A-WH-1',
              confirmedAt: new Date(),
            }),
            findMany: vi.fn().mockResolvedValue([
              { id: subOrderId, status: SubOrderStatus.CONFIRMED },
            ]),
          },
          order: {
            update: vi.fn().mockResolvedValue({
              id: orderId,
              orderNumber: 'OWT-100245',
              status: OrderStatus.CONFIRMED,
            }),
          },
        };
        return callback(tx);
      });

      const rawBody = JSON.stringify({
        subOrderId,
        status: 'CONFIRMED',
        confirmationRef: 'STORE-A-WH-1',
      });
      const nowSeconds = Math.floor(Date.now() / 1000);
      const signature = generateWebhookSignature(rawBody, nowSeconds, secret);

      const result = await processStoreConfirmationWebhook({
        rawBody,
        headers: {
          signature,
          timestamp: String(nowSeconds),
          dispensary: dispensaryId,
        },
        payload: {
          subOrderId,
          status: 'CONFIRMED',
          confirmationRef: 'STORE-A-WH-1',
        },
      });

      expect(result.status).toBe(SubOrderStatus.CONFIRMED);
      expect(result.confirmationRef).toBe('STORE-A-WH-1');
    });

    it('rejects with InvalidSignatureError when HMAC signature does not match dispensary secret', async () => {
      const mockSub = {
        id: subOrderId,
        dispensary: {
          id: dispensaryId,
          webhookSecret: secret,
        },
      };

      (prisma.subOrder.findUnique as any).mockResolvedValue(mockSub);

      const rawBody = JSON.stringify({
        subOrderId,
        status: 'CONFIRMED',
        confirmationRef: 'STORE-A-FORGED',
      });
      const nowSeconds = Math.floor(Date.now() / 1000);
      const forgedSignature = generateWebhookSignature(rawBody, nowSeconds, 'forged_attacker_secret');

      await expect(
        processStoreConfirmationWebhook({
          rawBody,
          headers: {
            signature: forgedSignature,
            timestamp: String(nowSeconds),
          },
          payload: {
            subOrderId,
            status: 'CONFIRMED',
            confirmationRef: 'STORE-A-FORGED',
          },
        })
      ).rejects.toThrow(InvalidSignatureError);
    });
  });
});

