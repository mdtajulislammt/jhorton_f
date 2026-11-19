export const ADMIN_COOKIE_NAME = 'owt_admin';
export const ADMIN_COOKIE_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours TTL
export const ADMIN_COOKIE_TTL_MS = ADMIN_COOKIE_MAX_AGE_SECONDS * 1000;

export interface AdminTokenPayload {
  userId: string;
  role: string;
}

export interface AdminTokenVerificationResult {
  valid: boolean;
  userId?: string;
  role?: string;
  expiresAt?: Date;
  reason?: 'MISSING' | 'MALFORMED' | 'EXPIRED' | 'INVALID_SIGNATURE';
}

export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: ADMIN_COOKIE_MAX_AGE_SECONDS,
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

/**
 * Creates an HMAC-SHA256 signed token for the admin session.
 * Format: `<userId>.<role>.<expiresAtTimestampMs>.<hmacSha256Hex>`
 */
export async function signAdminToken(
  payload: AdminTokenPayload,
  customSecret?: string,
  ttlMs = ADMIN_COOKIE_TTL_MS
): Promise<{ token: string; expiresAt: Date }> {
  const secret = customSecret || process.env.ADMIN_SESSION_SECRET || 'owtlet_admin_session_secret_min_32_chars';
  const key = await getHmacKey(secret);

  const expiresAt = new Date(Date.now() + ttlMs);
  const dataToSign = `${payload.userId}.${payload.role}.${expiresAt.getTime()}`;

  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(dataToSign)
  );

  const signatureHex = bytesToHex(new Uint8Array(signatureBuffer));
  const token = `${dataToSign}.${signatureHex}`;

  return { token, expiresAt };
}

/**
 * Validates and decodes an HMAC-SHA256 signed admin session token.
 * Safe to execute in edge runtime (Next.js middleware) and Node.js.
 */
export async function verifyAdminToken(
  token?: string,
  customSecret?: string
): Promise<AdminTokenVerificationResult> {
  if (!token) {
    return { valid: false, reason: 'MISSING' };
  }

  const parts = token.split('.');
  if (parts.length !== 4) {
    return { valid: false, reason: 'MALFORMED' };
  }

  const [userId, role, expiresAtStr, signatureHex] = parts;
  const expiresAtMs = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAtMs) || !userId || !role) {
    return { valid: false, reason: 'MALFORMED' };
  }

  const expiresAt = new Date(expiresAtMs);
  if (Date.now() > expiresAtMs) {
    return { valid: false, reason: 'EXPIRED', userId, role, expiresAt };
  }

  const sigBytes = hexToBytes(signatureHex);
  if (!sigBytes) {
    return { valid: false, reason: 'MALFORMED' };
  }

  const secret = customSecret || process.env.ADMIN_SESSION_SECRET || 'owtlet_admin_session_secret_min_32_chars';
  const key = await getHmacKey(secret);
  const dataToVerify = `${userId}.${role}.${expiresAtMs}`;
  const encoder = new TextEncoder();

  const isVerified = await crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes as unknown as BufferSource,
    encoder.encode(dataToVerify)
  );

  if (!isVerified) {
    return { valid: false, reason: 'INVALID_SIGNATURE' };
  }

  return {
    valid: true,
    userId,
    role,
    expiresAt,
  };
}
