import crypto from 'crypto';
import { z } from 'zod';
import { SubOrderStatus, OrderStatus } from '@prisma/client';
import { prisma } from '../db';
import { rollupOrderStatus } from './status';

// ============================================================================
// SCHEMAS & TYPES (Strict mode to reject unknown/unapproved fields)
// ============================================================================

export const storeConfirmationSchema = z
  .object({
    subOrderId: z.string().uuid('Valid subOrderId UUID required'),
    status: z.enum(['CONFIRMED', 'REJECTED']),
    confirmationRef: z.string().trim().min(1).max(255).optional().nullable(),
    confirmationUrl: z.string().trim().url().max(1024).optional().nullable(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.status === 'CONFIRMED') {
        return typeof data.confirmationRef === 'string' && data.confirmationRef.trim().length > 0;
      }
      return true;
    },
    {
      message: 'confirmationRef is required when status is CONFIRMED',
      path: ['confirmationRef'],
    }
  );

export type StoreConfirmationInput = z.infer<typeof storeConfirmationSchema>;

export interface StoreConfirmationResult {
  subOrderId: string;
  orderId: string;
  orderNumber: string;
  status: SubOrderStatus;
  orderStatus: OrderStatus;
  confirmationRef: string | null;
  confirmationUrl: string | null;
  confirmedAt: string | null;
  idempotent?: boolean;
}

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class InvalidSignatureError extends Error {
  readonly code = 'INVALID_SIGNATURE';
  readonly statusCode = 401;

  constructor(message = 'Invalid webhook signature or expired timestamp') {
    super(message);
    this.name = 'InvalidSignatureError';
  }
}

export class SubOrderNotFoundError extends Error {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;

  constructor(message = 'SubOrder not found') {
    super(message);
    this.name = 'SubOrderNotFoundError';
  }
}

export class ForbiddenWebhookAccessError extends Error {
  readonly code = 'FORBIDDEN';
  readonly statusCode = 403;

  constructor(message = 'Dispensary mismatch for this sub-order') {
    super(message);
    this.name = 'ForbiddenWebhookAccessError';
  }
}

export class ConfirmationConflictError extends Error {
  readonly code = 'CONFIRMATION_CONFLICT';
  readonly statusCode = 409;

  constructor(message = 'SubOrder confirmation conflict') {
    super(message);
    this.name = 'ConfirmationConflictError';
  }
}

// ============================================================================
// CRYPTOGRAPHIC HELPERS (HMAC-SHA256 & Signed Link Tokens)
// ============================================================================

/**
 * Generates an HMAC-SHA256 signature for a webhook raw body and timestamp.
 * Covers: `${timestamp}.${rawBody}` (docs/08 §1, §10).
 */
export function generateWebhookSignature(
  rawBody: string,
  timestamp: number | string,
  secret: string
): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${timestamp}.${rawBody}`);
  return `sha256=${hmac.digest('hex')}`;
}

/**
 * Verifies the incoming webhook HMAC signature and timestamp replay window (±5 minutes).
 */
export function verifyWebhookSignature({
  rawBody,
  signatureHeader,
  timestampHeader,
  secret,
  toleranceSeconds = 300,
}: {
  rawBody: string;
  signatureHeader?: string | null;
  timestampHeader?: string | null;
  secret: string;
  toleranceSeconds?: number;
}): { valid: boolean; error?: string } {
  if (!signatureHeader || !timestampHeader) {
    return { valid: false, error: 'Missing X-Owtlet-Signature or X-Owtlet-Timestamp header' };
  }

  const timestampNum = parseInt(timestampHeader, 10);
  if (isNaN(timestampNum)) {
    return { valid: false, error: 'Invalid X-Owtlet-Timestamp header' };
  }

  // Support timestamp in milliseconds if passed by mistake
  const tsInSeconds = timestampNum > 1e11 ? Math.floor(timestampNum / 1000) : timestampNum;
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (Math.abs(nowSeconds - tsInSeconds) > toleranceSeconds) {
    return { valid: false, error: 'Webhook timestamp outside 5-minute replay window' };
  }

  const cleanSig = signatureHeader.replace(/^sha256=/, '').trim();
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${timestampHeader}.${rawBody}`);
  const expectedSig = hmac.digest('hex');

  if (!/^[0-9a-fA-F]+$/.test(cleanSig) || cleanSig.length !== expectedSig.length) {
    return { valid: false, error: 'Invalid HMAC signature format or length' };
  }

  const bufA = Buffer.from(cleanSig, 'hex');
  const bufB = Buffer.from(expectedSig, 'hex');

  if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
    return { valid: false, error: 'Invalid HMAC signature' };
  }

  return { valid: true };
}

/**
 * Generates a signed token for email/direct links (GET /api/webhooks/store-confirmation?token=...)
 */
export function generateSignedConfirmationToken(
  payload: {
    subOrderId: string;
    status: 'CONFIRMED' | 'REJECTED';
    confirmationRef?: string | null;
    confirmationUrl?: string | null;
    expiresInSeconds?: number;
  },
  secret: string
): string {
  const expiresIn = payload.expiresInSeconds ?? 86400; // 24 hours default
  const exp = Math.floor(Date.now() / 1000) + expiresIn;
  const iat = Math.floor(Date.now() / 1000);

  const data = {
    subOrderId: payload.subOrderId,
    status: payload.status,
    confirmationRef: payload.confirmationRef ?? null,
    confirmationUrl: payload.confirmationUrl ?? null,
    exp,
    iat,
  };

  const payloadEncoded = Buffer.from(JSON.stringify(data)).toString('base64url');
  const hmac = crypto.createHmac('sha256', secret).update(payloadEncoded).digest('hex');
  return `${payloadEncoded}.${hmac}`;
}

/**
 * Verifies a signed token from GET /api/webhooks/store-confirmation?token=...
 */
export function verifySignedConfirmationToken(
  token: string,
  secret: string
): {
  valid: boolean;
  payload?: {
    subOrderId: string;
    status: 'CONFIRMED' | 'REJECTED';
    confirmationRef?: string | null;
    confirmationUrl?: string | null;
    exp: number;
    iat: number;
  };
  error?: string;
} {
  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Invalid token structure' };
  }

  const [payloadEncoded, signature] = parts;

  let data: any;
  try {
    data = JSON.parse(Buffer.from(payloadEncoded, 'base64url').toString('utf8'));
  } catch {
    return { valid: false, error: 'Invalid token payload format' };
  }

  if (!data || !data.subOrderId || !data.status || !data.exp) {
    return { valid: false, error: 'Malformed token payload' };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (nowSeconds > data.exp) {
    return { valid: false, error: 'Confirmation link has expired' };
  }

  const hmac = crypto.createHmac('sha256', secret).update(payloadEncoded).digest('hex');
  if (signature.length !== hmac.length) {
    return { valid: false, error: 'Invalid token signature length' };
  }

  const bufA = Buffer.from(signature, 'hex');
  const bufB = Buffer.from(hmac, 'hex');

  if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
    return { valid: false, error: 'Invalid token signature' };
  }

  return { valid: true, payload: data };
}

// ============================================================================
// STORE CONFIRMATION DOMAIN SERVICE
// ============================================================================

export interface ConfirmSubOrderOptions {
  subOrderId: string;
  status: 'CONFIRMED' | 'REJECTED';
  confirmationRef?: string | null;
  confirmationUrl?: string | null;
  expectedDispensaryId?: string | null;
}

/**
 * Core domain logic to confirm or reject a sub-order, update parent order status,
 * and enforce strict idempotency and conflict detection (docs/08 §10, AC-CNF-01, T-WH-01).
 */
export async function confirmSubOrder(
  options: ConfirmSubOrderOptions
): Promise<StoreConfirmationResult> {
  const { subOrderId, status, confirmationRef = null, confirmationUrl = null, expectedDispensaryId } =
    options;

  // 1. Fetch sub-order with dispensary and parent order
  const subOrder = await prisma.subOrder.findUnique({
    where: { id: subOrderId },
    include: {
      dispensary: true,
      order: {
        include: {
          subOrders: true,
        },
      },
    },
  });

  if (!subOrder) {
    throw new SubOrderNotFoundError(`SubOrder with ID ${subOrderId} not found`);
  }

  // 2. Validate dispensary match if provided via X-Owtlet-Dispensary header
  if (
    expectedDispensaryId &&
    expectedDispensaryId !== subOrder.dispensaryId &&
    expectedDispensaryId !== subOrder.dispensary.slug
  ) {
    throw new ForbiddenWebhookAccessError(
      `Dispensary header (${expectedDispensaryId}) does not match sub-order dispensary (${subOrder.dispensaryId})`
    );
  }

  const targetStatus =
    status === 'CONFIRMED' ? SubOrderStatus.CONFIRMED : SubOrderStatus.REJECTED;

  // 3. Idempotency & Conflict Resolution
  // 3a. SubOrder is already CONFIRMED
  if (subOrder.status === SubOrderStatus.CONFIRMED) {
    if (status === 'CONFIRMED') {
      if (subOrder.confirmationRef === confirmationRef) {
        // Idempotent duplicate delivery
        return {
          subOrderId: subOrder.id,
          orderId: subOrder.orderId,
          orderNumber: subOrder.order.orderNumber,
          status: SubOrderStatus.CONFIRMED,
          orderStatus: subOrder.order.status,
          confirmationRef: subOrder.confirmationRef,
          confirmationUrl: subOrder.confirmationUrl,
          confirmedAt: subOrder.confirmedAt ? subOrder.confirmedAt.toISOString() : null,
          idempotent: true,
        };
      } else {
        // Conflicting confirmation reference
        throw new ConfirmationConflictError(
          `SubOrder ${subOrderId} is already confirmed with ref "${subOrder.confirmationRef}", conflicting with new ref "${confirmationRef}"`
        );
      }
    } else {
      // Trying to reject an already confirmed sub-order
      throw new ConfirmationConflictError(
        `SubOrder ${subOrderId} is already confirmed and cannot be rejected via webhook`
      );
    }
  }

  // 3b. SubOrder is already REJECTED
  if (subOrder.status === SubOrderStatus.REJECTED) {
    if (status === 'REJECTED') {
      return {
        subOrderId: subOrder.id,
        orderId: subOrder.orderId,
        orderNumber: subOrder.order.orderNumber,
        status: SubOrderStatus.REJECTED,
        orderStatus: subOrder.order.status,
        confirmationRef: subOrder.confirmationRef,
        confirmationUrl: subOrder.confirmationUrl,
        confirmedAt: null,
        idempotent: true,
      };
    } else {
      throw new ConfirmationConflictError(
        `SubOrder ${subOrderId} was already rejected and cannot be confirmed`
      );
    }
  }

  // 4. Atomic Transaction: Update SubOrder and roll up parent Order status
  const now = new Date();
  const { updatedSubOrder, updatedOrder } = await prisma.$transaction(async (tx) => {
    const updatedSub = await tx.subOrder.update({
      where: { id: subOrderId },
      data: {
        status: targetStatus,
        confirmationRef: confirmationRef ?? subOrder.confirmationRef,
        confirmationUrl: confirmationUrl ?? subOrder.confirmationUrl,
        confirmedAt: targetStatus === SubOrderStatus.CONFIRMED ? (subOrder.confirmedAt || now) : null,
      },
    });

    const siblingSubOrders = await tx.subOrder.findMany({
      where: { orderId: subOrder.orderId },
      select: { id: true, status: true },
    });

    const allStatuses = siblingSubOrders.map((so) =>
      so.id === subOrderId ? targetStatus : so.status
    );
    const newOrderStatus = rollupOrderStatus(allStatuses);

    const updatedOrd = await tx.order.update({
      where: { id: subOrder.orderId },
      data: { status: newOrderStatus },
    });

    return { updatedSubOrder: updatedSub, updatedOrder: updatedOrd };
  });

  return {
    subOrderId: updatedSubOrder.id,
    orderId: updatedOrder.id,
    orderNumber: updatedOrder.orderNumber,
    status: updatedSubOrder.status,
    orderStatus: updatedOrder.status,
    confirmationRef: updatedSubOrder.confirmationRef,
    confirmationUrl: updatedSubOrder.confirmationUrl,
    confirmedAt: updatedSubOrder.confirmedAt ? updatedSubOrder.confirmedAt.toISOString() : null,
    idempotent: false,
  };
}

/**
 * Top-level processor for incoming POST /api/webhooks/store-confirmation requests.
 * Handles HMAC verification using the fulfilling dispensary's webhookSecret.
 */
export async function processStoreConfirmationWebhook({
  rawBody,
  headers,
  payload,
}: {
  rawBody: string;
  headers: {
    signature?: string | null;
    timestamp?: string | null;
    dispensary?: string | null;
  };
  payload: StoreConfirmationInput;
}): Promise<StoreConfirmationResult> {
  // 1. Fetch sub-order to retrieve the dispensary's webhookSecret
  const subOrder = await prisma.subOrder.findUnique({
    where: { id: payload.subOrderId },
    include: { dispensary: true },
  });

  if (!subOrder) {
    throw new SubOrderNotFoundError(`SubOrder with ID ${payload.subOrderId} not found`);
  }

  // 2. Validate HMAC signature against dispensary.webhookSecret
  const verification = verifyWebhookSignature({
    rawBody,
    signatureHeader: headers.signature,
    timestampHeader: headers.timestamp,
    secret: subOrder.dispensary.webhookSecret,
  });

  if (!verification.valid) {
    throw new InvalidSignatureError(verification.error || 'Invalid HMAC signature');
  }

  // 3. Confirm sub-order
  return confirmSubOrder({
    subOrderId: payload.subOrderId,
    status: payload.status,
    confirmationRef: payload.confirmationRef,
    confirmationUrl: payload.confirmationUrl,
    expectedDispensaryId: headers.dispensary,
  });
}

