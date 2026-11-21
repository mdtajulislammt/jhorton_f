import crypto from 'crypto';

export interface SignedPayloadItem {
  sku: string;
  vendorSku?: string | null;
  vendorProductId?: string | null;
  vendorVariantId?: string | null;
  quantity: number;
  name: string;
  price?: string | number | null;
}

export interface SignedPayloadData {
  vendorId: string;
  orderNumber: string;
  items: SignedPayloadItem[];
  timestamp: number;
  expiresAt: number;
}

/**
 * Creates a signed payload object and HMAC-SHA256 signature using the dispensary's webhookSecret.
 * Default expiration is 15 minutes.
 */
export function createSignedPayload(
  vendorId: string,
  orderNumber: string,
  items: SignedPayloadItem[],
  secret: string,
  expiresInSeconds: number = 15 * 60
): { payload: string; sig: string; data: SignedPayloadData } {
  const now = Math.floor(Date.now() / 1000);
  const data: SignedPayloadData = {
    vendorId,
    orderNumber,
    items,
    timestamp: now,
    expiresAt: now + expiresInSeconds,
  };

  const payloadString = JSON.stringify(data);
  const payloadBase64 = Buffer.from(payloadString, 'utf-8').toString('base64url');

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payloadBase64);
  const sig = hmac.digest('hex');

  return {
    payload: payloadBase64,
    sig,
    data,
  };
}

export interface VerifySignedPayloadResult {
  valid: boolean;
  reason?: 'EXPIRED' | 'INVALID_SIGNATURE' | 'MALFORMED';
  data?: SignedPayloadData;
}

/**
 * Verifies a signed payload using HMAC-SHA256 and checks expiration.
 */
export function verifySignedPayload(
  payloadBase64: string,
  sig: string,
  secret: string,
  currentTimeSeconds: number = Math.floor(Date.now() / 1000)
): VerifySignedPayloadResult {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadBase64);
    const expectedSig = hmac.digest('hex');

    // Constant-time comparison
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
      return { valid: false, reason: 'INVALID_SIGNATURE' };
    }

    const jsonStr = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
    const data: SignedPayloadData = JSON.parse(jsonStr);

    if (data.expiresAt < currentTimeSeconds) {
      return { valid: false, reason: 'EXPIRED', data };
    }

    return { valid: true, data };
  } catch {
    return { valid: false, reason: 'MALFORMED' };
  }
}

