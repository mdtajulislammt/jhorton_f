/**
 * Edge-safe shopper token crypto utilities for Next.js Middleware
 * Pure Web Crypto API (SubtleCrypto) only — ZERO Node.js / argon2 imports!
 */

export const SHOPPER_COOKIE_NAME = 'owt_shopper';
export const SHOPPER_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days
export const SHOPPER_COOKIE_TTL_MS = SHOPPER_COOKIE_MAX_AGE_SECONDS * 1000;

export interface ShopperTokenPayload {
  shopperId: string;
}

export interface ShopperTokenVerificationResult {
  valid: boolean;
  shopperId?: string;
  expiresAt?: Date;
  reason?: 'MISSING' | 'MALFORMED' | 'EXPIRED' | 'INVALID_SIGNATURE';
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array | null {
  if (!hex || hex.length % 2 !== 0) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    const val = parseInt(hex.substring(i, i + 2), 16);
    if (isNaN(val)) return null;
    bytes[i / 2] = val;
  }
  return bytes;
}

function getShopperSecret(): string {
  return (
    process.env.SHOPPER_SESSION_SECRET ||
    'change_me_shopper_session_secret_min_32_chars'
  );
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createShopperToken(
  payload: ShopperTokenPayload,
  customTtlMs: number = SHOPPER_COOKIE_TTL_MS
): Promise<string> {
  const enc = new TextEncoder();
  const secret = getShopperSecret();
  const expiresAtMs = Date.now() + customTtlMs;
  const data = `${payload.shopperId}|${expiresAtMs}`;

  const key = await getHmacKey(secret);
  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const sigHex = bytesToHex(new Uint8Array(sigBuffer));

  return `${data}|${sigHex}`;
}

export async function verifyShopperToken(
  token: string | null | undefined
): Promise<ShopperTokenVerificationResult> {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'MISSING' };
  }

  const parts = token.split('|');
  if (parts.length !== 3) {
    return { valid: false, reason: 'MALFORMED' };
  }

  const [shopperId, expiresAtStr, sigHex] = parts;
  const expiresAtMs = parseInt(expiresAtStr, 10);

  if (!shopperId || isNaN(expiresAtMs) || !sigHex) {
    return { valid: false, reason: 'MALFORMED' };
  }

  const expiresAt = new Date(expiresAtMs);
  if (Date.now() > expiresAtMs) {
    return { valid: false, shopperId, expiresAt, reason: 'EXPIRED' };
  }

  const sigBytes = hexToBytes(sigHex);
  if (!sigBytes) {
    return { valid: false, reason: 'MALFORMED' };
  }

  const enc = new TextEncoder();
  const secret = getShopperSecret();
  const data = `${shopperId}|${expiresAtStr}`;

  try {
    const key = await getHmacKey(secret);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      // Type-only cast (same as age-session/crypto.ts): TS 5.7+ lib types reject Uint8Array<ArrayBufferLike> here.
      sigBytes as unknown as BufferSource,
      enc.encode(data)
    );

    if (!valid) {
      return { valid: false, reason: 'INVALID_SIGNATURE' };
    }

    return {
      valid: true,
      shopperId,
      expiresAt,
    };
  } catch {
    return { valid: false, reason: 'INVALID_SIGNATURE' };
  }
}

