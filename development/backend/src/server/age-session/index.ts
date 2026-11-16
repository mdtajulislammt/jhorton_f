import { db } from '../db';
import {
  signAgeToken,
  verifyAgeToken,
  AGE_COOKIE_NAME,
  AGE_COOKIE_MAX_AGE_SECONDS,
  AGE_COOKIE_TTL_MS,
  AGE_COOKIE_OPTIONS,
  type AgeVerificationResult,
} from './crypto';

export {
  signAgeToken,
  verifyAgeToken,
  AGE_COOKIE_NAME,
  AGE_COOKIE_MAX_AGE_SECONDS,
  AGE_COOKIE_TTL_MS,
  AGE_COOKIE_OPTIONS,
  type AgeVerificationResult,
};

export async function hashSha256(text: string): Promise<string> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface RecordAgeSessionParams {
  nonce: string;
  confirmed: boolean;
  ip?: string | null;
  userAgent?: string | null;
  expiresAt: Date;
}

/**
 * Persists an attestation audit log row into AgeVerificationSession.
 * Stores only hashed nonces/IPs — NEVER DOB, government ID, or names.
 */
export async function recordAgeVerificationSession(params: RecordAgeSessionParams) {
  try {
    const sessionHash = await hashSha256(params.nonce);
    const salt = process.env.IP_HASH_SALT || 'owtlet_ip_hash_salt_2026';
    const ipHash = params.ip ? await hashSha256(`${params.ip}:${salt}`) : null;

    return await db.ageVerificationSession.upsert({
      where: { sessionHash },
      update: {
        confirmed: params.confirmed,
        ipHash,
        userAgent: params.userAgent?.slice(0, 500) || null,
        expiresAt: params.expiresAt,
      },
      create: {
        sessionHash,
        confirmed: params.confirmed,
        ipHash,
        userAgent: params.userAgent?.slice(0, 500) || null,
        expiresAt: params.expiresAt,
      },
    });
  } catch (error) {
    console.error('[AgeSession] Error recording age verification audit session:', error);
    return null;
  }
}

