import { cookies } from 'next/headers';

export const AGE_COOKIE_NAME = 'owt_age';
export const ADMIN_COOKIE_NAME = 'owt_admin';
export const SHOPPER_COOKIE_NAME = 'owt_shopper';
export const CART_COOKIE_NAME = 'owt_cart';
export const AGE_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days
export const AGE_COOKIE_TTL_MS = AGE_COOKIE_MAX_AGE_SECONDS * 1000;

export interface AgeVerificationResult {
  valid: boolean;
  reason?: 'MISSING' | 'MALFORMED' | 'EXPIRED' | 'INVALID_SIGNATURE';
  nonce?: string;
  expiresAt?: Date;
}

export const AGE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: AGE_COOKIE_MAX_AGE_SECONDS,
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
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function getAgeSecret(customSecret?: string): string {
  if (customSecret) return customSecret;
  const envSecret = process.env.AGE_COOKIE_SECRET;
  if (!envSecret && process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL SECURITY ERROR: AGE_COOKIE_SECRET environment variable is missing in production.');
  }
  return envSecret || 'owtlet_age_cookie_default_secret_min_32_chars';
}

function getAdminSecret(customSecret?: string): string {
  if (customSecret) return customSecret;
  const envSecret = process.env.ADMIN_SESSION_SECRET;
  if (!envSecret && process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL SECURITY ERROR: ADMIN_SESSION_SECRET environment variable is missing in production.');
  }
  return envSecret || 'owtlet_admin_session_secret_min_32_chars';
}

function getShopperSecret(customSecret?: string): string {
  if (customSecret) return customSecret;
  const envSecret = process.env.SHOPPER_SESSION_SECRET;
  if (!envSecret && process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL SECURITY ERROR: SHOPPER_SESSION_SECRET environment variable is missing in production.');
  }
  return envSecret || 'owtlet_shopper_session_secret_min_32_chars';
}

export async function verifyAgeToken(
  token: string | undefined | null,
  customSecret?: string
): Promise<AgeVerificationResult> {
  if (!token) return { valid: false, reason: 'MISSING' };
  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false, reason: 'MALFORMED' };

  const [nonce, expiresTimestampStr, signatureHex] = parts;
  if (!nonce || !expiresTimestampStr || !signatureHex) return { valid: false, reason: 'MALFORMED' };

  const sigBytes = hexToBytes(signatureHex);
  if (!sigBytes) return { valid: false, reason: 'MALFORMED' };

  const expiresTimestamp = parseInt(expiresTimestampStr, 10);
  if (isNaN(expiresTimestamp)) return { valid: false, reason: 'MALFORMED' };
  if (Date.now() > expiresTimestamp) return { valid: false, reason: 'EXPIRED' };

  const secret = getAgeSecret(customSecret);
  const key = await getHmacKey(secret);

  const payload = `${nonce}.${expiresTimestampStr}`;
  const encoder = new TextEncoder();
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes as unknown as BufferSource,
    encoder.encode(payload)
  );

  if (!isValid) return { valid: false, reason: 'INVALID_SIGNATURE' };
  return { valid: true, nonce, expiresAt: new Date(expiresTimestamp) };
}

export async function isAgeVerified(): Promise<boolean> {
  const token = cookies().get(AGE_COOKIE_NAME)?.value;
  const result = await verifyAgeToken(token);
  return result.valid;
}

export interface AdminTokenVerificationResult {
  valid: boolean;
  userId?: string;
  role?: string;
  expiresAt?: Date;
  reason?: 'MISSING' | 'MALFORMED' | 'EXPIRED' | 'INVALID_SIGNATURE';
}

export async function verifyAdminToken(
  token?: string,
  customSecret?: string
): Promise<AdminTokenVerificationResult> {
  if (!token) return { valid: false, reason: 'MISSING' };
  const parts = token.split('.');
  if (parts.length !== 4) return { valid: false, reason: 'MALFORMED' };

  const [userId, role, expiresAtStr, signatureHex] = parts;
  const expiresAtMs = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAtMs) || !userId || !role) return { valid: false, reason: 'MALFORMED' };

  const expiresAt = new Date(expiresAtMs);
  if (Date.now() > expiresAtMs) return { valid: false, reason: 'EXPIRED', userId, role, expiresAt };

  const sigBytes = hexToBytes(signatureHex);
  if (!sigBytes) return { valid: false, reason: 'MALFORMED' };

  const secret = getAdminSecret(customSecret);
  const key = await getHmacKey(secret);
  const dataToVerify = `${userId}.${role}.${expiresAtMs}`;
  const encoder = new TextEncoder();

  const isVerified = await crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes as unknown as BufferSource,
    encoder.encode(dataToVerify)
  );

  if (!isVerified) return { valid: false, reason: 'INVALID_SIGNATURE' };
  return { valid: true, userId, role, expiresAt };
}

export interface ShopperTokenVerificationResult {
  valid: boolean;
  shopperId?: string;
  expiresAt?: Date;
  reason?: 'MISSING' | 'MALFORMED' | 'EXPIRED' | 'INVALID_SIGNATURE';
}

export async function verifyShopperToken(
  token?: string,
  customSecret?: string
): Promise<ShopperTokenVerificationResult> {
  if (!token) return { valid: false, reason: 'MISSING' };
  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false, reason: 'MALFORMED' };

  const [shopperId, expiresAtStr, signatureHex] = parts;
  const expiresAtMs = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAtMs) || !shopperId) return { valid: false, reason: 'MALFORMED' };

  const expiresAt = new Date(expiresAtMs);
  if (expiresAt.getTime() < Date.now()) return { valid: false, shopperId, expiresAt, reason: 'EXPIRED' };

  const expectedSignatureBytes = hexToBytes(signatureHex);
  if (!expectedSignatureBytes) return { valid: false, reason: 'MALFORMED' };

  const secret = getShopperSecret(customSecret);
  const key = await getHmacKey(secret);

  const dataToSign = `${shopperId}.${expiresAtStr}`;
  const encoder = new TextEncoder();
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    expectedSignatureBytes as unknown as BufferSource,
    encoder.encode(dataToSign)
  );

  if (!isValid) return { valid: false, reason: 'INVALID_SIGNATURE' };
  return { valid: true, shopperId, expiresAt };
}
