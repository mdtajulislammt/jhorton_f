import * as argon2 from 'argon2';
import crypto from 'crypto';

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

export const SHOPPER_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SHOPPER_COOKIE_MAX_AGE_SECONDS,
};

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

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function getShopperSecret(customSecret?: string): string {
  if (customSecret) return customSecret;
  const envSecret = process.env.SHOPPER_SESSION_SECRET;
  if (!envSecret && process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL SECURITY ERROR: SHOPPER_SESSION_SECRET environment variable is missing in production.');
  }
  return envSecret || 'owtlet_shopper_session_secret_min_32_chars';
}

/**
 * Creates an HMAC-SHA256 signed session token for the shopper.
 * Format: `<shopperId>.<expiresAtTimestampMs>.<hmacSha256Hex>`
 */
export async function signShopperToken(
  payload: ShopperTokenPayload,
  customSecret?: string,
  ttlMs = SHOPPER_COOKIE_TTL_MS
): Promise<{ token: string; expiresAt: Date }> {
  const secret = getShopperSecret(customSecret);
  const key = await getHmacKey(secret);

  const expiresAt = new Date(Date.now() + ttlMs);
  const dataToSign = `${payload.shopperId}.${expiresAt.getTime()}`;

  const encoder = new TextEncoder();
  const signatureBuffer = await globalThis.crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(dataToSign)
  );

  const signatureHex = bytesToHex(new Uint8Array(signatureBuffer));
  const token = `${dataToSign}.${signatureHex}`;

  return { token, expiresAt };
}

/**
 * Validates and decodes an HMAC-SHA256 signed shopper session token.
 * Safe to execute in edge runtime (Next.js middleware) and Node.js.
 */
export async function verifyShopperToken(
  token?: string,
  customSecret?: string
): Promise<ShopperTokenVerificationResult> {
  if (!token) {
    return { valid: false, reason: 'MISSING' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, reason: 'MALFORMED' };
  }

  const [shopperId, expiresAtStr, signatureHex] = parts;
  const expiresAtMs = parseInt(expiresAtStr, 10);

  if (isNaN(expiresAtMs) || !shopperId) {
    return { valid: false, reason: 'MALFORMED' };
  }

  const expiresAt = new Date(expiresAtMs);
  if (expiresAt.getTime() < Date.now()) {
    return { valid: false, shopperId, expiresAt, reason: 'EXPIRED' };
  }

  const expectedSignatureBytes = hexToBytes(signatureHex);
  if (!expectedSignatureBytes) {
    return { valid: false, reason: 'MALFORMED' };
  }

  const secret = getShopperSecret(customSecret);
  const key = await getHmacKey(secret);

  const dataToSign = `${shopperId}.${expiresAtStr}`;
  const encoder = new TextEncoder();
  const isValid = await globalThis.crypto.subtle.verify(
    'HMAC',
    key,
    expectedSignatureBytes as unknown as BufferSource,
    encoder.encode(dataToSign)
  );

  if (!isValid) {
    return { valid: false, reason: 'INVALID_SIGNATURE' };
  }

  return {
    valid: true,
    shopperId,
    expiresAt,
  };
}

/**
 * Hashes a password with argon2id.
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
    parallelism: 1,
  });
}

/**
 * Verifies a password against an argon2id hash.
 */
export async function verifyPassword(
  hash: string,
  plainText: string
): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainText);
  } catch {
    return false;
  }
}

/**
 * Generates a single-use password reset token (32 random bytes hex)
 * and its SHA-256 hash for database storage. 1-hour expiry.
 */
export function generatePasswordResetToken(ttlHours = 1): {
  token: string;
  tokenHash: string;
  expiresAt: Date;
} {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  return { token, tokenHash, expiresAt };
}

/**
 * Computes SHA-256 hash of a reset token string for DB lookup.
 */
export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}
