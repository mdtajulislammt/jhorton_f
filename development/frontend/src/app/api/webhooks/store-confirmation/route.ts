import { NextRequest, NextResponse } from 'next/server';
import { ok, fail } from '@/server/http';
import { prisma } from '@/server/db';
import {
  storeConfirmationSchema,
  processStoreConfirmationWebhook,
  confirmSubOrder,
  verifySignedConfirmationToken,
  InvalidSignatureError,
  SubOrderNotFoundError,
  ForbiddenWebhookAccessError,
  ConfirmationConflictError,
} from '@/server/orders/confirm';

/**
 * POST /api/webhooks/store-confirmation
 *
 * Partner Dispensary Confirmation Webhook (docs/08 §10, AC-CNF-01, T-WH-01).
 * Requires HMAC-SHA256 signature in X-Owtlet-Signature header and replay timestamp.
 * Age gate bypassed (public webhook endpoint).
 */
export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return fail('VALIDATION_ERROR', 'Unable to read request body', 400);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return fail('VALIDATION_ERROR', 'Invalid JSON body', 400);
  }

  const parseResult = storeConfirmationSchema.safeParse(body);
  if (!parseResult.success) {
    const details = parseResult.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return fail('VALIDATION_ERROR', 'Invalid confirmation payload', 400, details);
  }

  const signature =
    request.headers.get('x-owtlet-signature') ||
    request.headers.get('X-Owtlet-Signature') ||
    null;
  const timestamp =
    request.headers.get('x-owtlet-timestamp') ||
    request.headers.get('X-Owtlet-Timestamp') ||
    null;
  const dispensary =
    request.headers.get('x-owtlet-dispensary') ||
    request.headers.get('X-Owtlet-Dispensary') ||
    null;

  try {
    const result = await processStoreConfirmationWebhook({
      rawBody,
      headers: {
        signature,
        timestamp,
        dispensary,
      },
      payload: parseResult.data,
    });

    return ok(result, 'Store confirmation recorded', 200);
  } catch (err: any) {
    if (err instanceof InvalidSignatureError || err.code === 'INVALID_SIGNATURE') {
      return fail('INVALID_SIGNATURE', err.message, 401);
    }
    if (err instanceof SubOrderNotFoundError || err.code === 'NOT_FOUND') {
      return fail('NOT_FOUND', err.message, 404);
    }
    if (err instanceof ForbiddenWebhookAccessError || err.code === 'FORBIDDEN') {
      return fail('FORBIDDEN', err.message, 403);
    }
    if (err instanceof ConfirmationConflictError || err.code === 'CONFIRMATION_CONFLICT') {
      return fail('CONFIRMATION_CONFLICT', err.message, 409);
    }

    return fail('SERVER_ERROR', err?.message || 'Failed to process store confirmation', 500);
  }
}

/**
 * GET /api/webhooks/store-confirmation
 *
 * Alternative confirmation route for dispensaries without webhook infrastructure
 * (docs/08 §10, Q-002 signed link variant).
 * Supports ?token=<jwt-style-hmac-token>
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return fail(
      'VALIDATION_ERROR',
      'Missing confirmation token. Pass ?token=<signed-token>',
      400
    );
  }

  // 1. Decode payload structure to find subOrderId
  const parts = token.split('.');
  if (parts.length !== 2) {
    return fail('INVALID_SIGNATURE', 'Invalid confirmation token structure', 401);
  }

  let tokenData: any;
  try {
    tokenData = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
  } catch {
    return fail('INVALID_SIGNATURE', 'Invalid token encoding', 401);
  }

  if (!tokenData?.subOrderId) {
    return fail('INVALID_SIGNATURE', 'Token missing subOrderId', 401);
  }

  // 2. Fetch dispensary webhookSecret for verification
  const subOrder = await prisma.subOrder.findUnique({
    where: { id: tokenData.subOrderId },
    include: { dispensary: true },
  });

  if (!subOrder) {
    return fail('NOT_FOUND', 'SubOrder not found', 404);
  }

  // 3. Verify signature and expiry
  const verified = verifySignedConfirmationToken(token, subOrder.dispensary.webhookSecret);
  if (!verified.valid || !verified.payload) {
    return fail('INVALID_SIGNATURE', verified.error || 'Invalid or expired confirmation token', 401);
  }

  try {
    const result = await confirmSubOrder({
      subOrderId: verified.payload.subOrderId,
      status: verified.payload.status,
      confirmationRef: verified.payload.confirmationRef,
      confirmationUrl: verified.payload.confirmationUrl,
      expectedDispensaryId: subOrder.dispensaryId,
    });

    const isHtml = request.headers.get('accept')?.includes('text/html');
    if (isHtml) {
      // Redirect store manager to confirmation view on storefront
      const origin = request.nextUrl.origin;
      return NextResponse.redirect(new URL(`/order/${result.orderId}?confirmed=true`, origin));
    }

    return ok(result, 'Store confirmation recorded', 200);
  } catch (err: any) {
    if (err instanceof ConfirmationConflictError) {
      return fail('CONFIRMATION_CONFLICT', err.message, 409);
    }
    return fail('SERVER_ERROR', err?.message || 'Failed to process confirmation', 500);
  }
}

