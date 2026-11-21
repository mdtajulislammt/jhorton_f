import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubOrderStatus, OrderStatus, FulfillmentType, AssignmentSource, HandoffChannel } from '@prisma/client';
import { prisma } from '../server/db';
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
} from '../server/orders/confirm';

vi.mock('../server/db', () => ({
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

describe('Backend Dispensary Confirmation Webhook (Edith, AC-CNF-01, T-WH-01)', () => {
  const secret = 'dispensary_test_secret_32bytes_min!';
  const subOrderId = 'b0000000-0000-0000-0000-000000000001';
  const orderId = 'a0000000-0000-0000-0000-000000000001';
  const dispensaryId = 'd0000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

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

    it('rejects timestamp outside 5-minute replay window', () => {
      const rawBody = '{"test":true}';
      const pastSeconds = Math.floor(Date.now() / 1000) - 305;
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
  });

  describe('Signed Token Links', () => {
    it('generates and verifies signed confirmation token', () => {
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
    });
  });

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
      handoffChannel: HandoffChannel.DEEP_LINK,
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
        status: OrderStatus.HANDED_OFF as any,
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

    it('handles idempotent duplicate confirmation', async () => {
      const mockSub = createMockSubOrder(SubOrderStatus.CONFIRMED, 'STORE-A-DUP');
      mockSub.order.status = OrderStatus.CONFIRMED;
      (prisma.subOrder.findUnique as any).mockResolvedValue(mockSub);

      const result = await confirmSubOrder({
        subOrderId,
        status: 'CONFIRMED',
        confirmationRef: 'STORE-A-DUP',
      });

      expect(result.idempotent).toBe(true);
      expect(result.status).toBe(SubOrderStatus.CONFIRMED);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws ConfirmationConflictError (409) when confirmationRef conflicts', async () => {
      const mockSub = createMockSubOrder(SubOrderStatus.CONFIRMED, 'STORE-A-FIRST');
      (prisma.subOrder.findUnique as any).mockResolvedValue(mockSub);

      await expect(
        confirmSubOrder({
          subOrderId,
          status: 'CONFIRMED',
          confirmationRef: 'STORE-A-CONFLICT',
        })
      ).rejects.toThrow(ConfirmationConflictError);
    });
  });
});

