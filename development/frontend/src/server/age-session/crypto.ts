export const AGE_COOKIE_NAME = 'owt_age';
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

/**
 * Creates an HMAC-signed token for the 21+ age attestation cookie.
 * Format: `<nonce>.<expiresAtTimestampMs>.<hmacSha256Hex>`
 */
export async function signAgeToken(
  customSecret?: string,
  ttlMs = AGE_COOKIE_TTL_MS
): Promise<{ token: string; nonce: string; expiresAt: Date }> {
  const secret = getAgeSecret(customSecret);
  const key = await getHmacKey(secret);

  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const nonce = bytesToHex(nonceBytes);

  const expiresTimestamp = Date.now() + ttlMs;
  const payload = `${nonce}.${expiresTimestamp}`;

  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const signature = bytesToHex(new Uint8Array(signatureBuffer));

  const token = `${payload}.${signature}`;
  return {
    token,
    nonce,
    expiresAt: new Date(expiresTimestamp),
  };
}

/**
 * Verifies an age cookie token against HMAC-SHA256 signature and expiration timestamp.
 * Edge-compatible (uses standard Web Crypto API).
 */
export async function verifyAgeToken(
  token: string | undefined | null,
  customSecret?: string
): Promise<AgeVerificationResult> {
  if (!token) {
    return { valid: false, reason: 'MISSING' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, reason: 'MALFORMED' };
  }

  const [nonce, expiresTimestampStr, signatureHex] = parts;
  if (!nonce || !expiresTimestampStr || !signatureHex) {
    return { valid: false, reason: 'MALFORMED' };
  }

  const sigBytes = hexToBytes(signatureHex);
  if (!sigBytes) {
    return { valid: false, reason: 'MALFORMED' };
  }

  const expiresTimestamp = parseInt(expiresTimestampStr, 10);
  if (isNaN(expiresTimestamp)) {
    return { valid: false, reason: 'MALFORMED' };
  }

  if (Date.now() > expiresTimestamp) {
    return { valid: false, reason: 'EXPIRED' };
  }

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

  if (!isValid) {
    return { valid: false, reason: 'INVALID_SIGNATURE' };
  }

  return {
    valid: true,
    nonce,
    expiresAt: new Date(expiresTimestamp),
  };
}
