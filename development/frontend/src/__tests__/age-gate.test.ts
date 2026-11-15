import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  signAgeToken,
  verifyAgeToken,
  AGE_COOKIE_NAME,
  AGE_COOKIE_TTL_MS,
} from '../server/age-session/crypto';
import { POST as ageVerifyPost, GET as ageVerifyGet } from '../app/api/age-verify/route';
import { middleware } from '../middleware';

// Mock DB call in age-session index
vi.mock('@/server/db', () => ({
  db: {
    ageVerificationSession: {
      upsert: vi.fn().mockResolvedValue({ id: 'test-session-id' }),
    },
  },
}));

describe('21+ Age Gate System (AC-AGE-01, AC-AGE-02, AC-AGE-03)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Cryptographic HMAC Token Signing & Verification (crypto.ts)', () => {
    it('signs an age attestation token with 30-day expiration and HMAC-SHA256 signature', async () => {
      const { token, nonce, expiresAt } = await signAgeToken();

      expect(token).toBeDefined();
      expect(nonce).toBeDefined();
      expect(nonce).toHaveLength(32); // 16 bytes hex

      const parts = token.split('.');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe(nonce);

      const parsedExp = parseInt(parts[1], 10);
      expect(parsedExp).toBeGreaterThan(Date.now() + AGE_COOKIE_TTL_MS - 5000);
      expect(parsedExp).toBeLessThanOrEqual(Date.now() + AGE_COOKIE_TTL_MS);

      expect(expiresAt.getTime()).toBe(parsedExp);
      expect(parts[2]).toHaveLength(64); // SHA-256 hex
    });

    it('verifies a freshly signed token as valid', async () => {
      const { token, nonce } = await signAgeToken();
      const result = await verifyAgeToken(token);

      expect(result.valid).toBe(true);
      expect(result.nonce).toBe(nonce);
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('rejects missing or empty tokens with reason MISSING', async () => {
      const r1 = await verifyAgeToken(undefined);
      expect(r1.valid).toBe(false);
      expect(r1.reason).toBe('MISSING');

      const r2 = await verifyAgeToken('');
      expect(r2.valid).toBe(false);
      expect(r2.reason).toBe('MISSING');
    });

    it('rejects malformed tokens with reason MALFORMED', async () => {
      const r1 = await verifyAgeToken('just-a-single-string');
      expect(r1.valid).toBe(false);
      expect(r1.reason).toBe('MALFORMED');

      const r2 = await verifyAgeToken('nonce.notanumber.signature');
      expect(r2.valid).toBe(false);
      expect(r2.reason).toBe('MALFORMED');

      const r3 = await verifyAgeToken('nonce.123456789.nothex!');
      expect(r3.valid).toBe(false);
      expect(r3.reason).toBe('MALFORMED');
    });

    it('rejects expired tokens with reason EXPIRED', async () => {
      // Create a token expired 1 hour ago
      const expiredTtlMs = -3600000;
      const { token } = await signAgeToken(undefined, expiredTtlMs);

      const result = await verifyAgeToken(token);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('EXPIRED');
    });

    it('rejects tampered tokens with reason INVALID_SIGNATURE', async () => {
      const { token } = await signAgeToken();
      const parts = token.split('.');

      // Tamper with the nonce
      const tamperedNonce = 'a'.repeat(32);
      const tamperedToken1 = `${tamperedNonce}.${parts[1]}.${parts[2]}`;
      const r1 = await verifyAgeToken(tamperedToken1);
      expect(r1.valid).toBe(false);
      expect(r1.reason).toBe('INVALID_SIGNATURE');

      // Tamper with signature
      const tamperedSignature = 'f'.repeat(64);
      const tamperedToken2 = `${parts[0]}.${parts[1]}.${tamperedSignature}`;
      const r2 = await verifyAgeToken(tamperedToken2);
      expect(r2.valid).toBe(false);
      expect(r2.reason).toBe('INVALID_SIGNATURE');
    });

    it('rejects tokens signed with a different secret', async () => {
      const { token } = await signAgeToken('secret_key_one_32_characters_long');
      const result = await verifyAgeToken(token, 'different_secret_key_32_chars_long');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('INVALID_SIGNATURE');
    });
  });

  describe('2. Route Handler API (/api/age-verify)', () => {
    it('returns 400 Bad Request when confirmed21Plus is missing or invalid', async () => {
      const req = new NextRequest('http://localhost:3000/api/age-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invalidField: true }),
      });

      const res = await ageVerifyPost(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('BAD_REQUEST');
    });

    it('returns 403 Forbidden when visitor declares under 21 (confirmed21Plus = false)', async () => {
      const req = new NextRequest('http://localhost:3000/api/age-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed21Plus: false }),
      });

      const res = await ageVerifyPost(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('FORBIDDEN');
      expect(json.error.message).toContain('You must be 21 or older to enter Owtlet.');
    });

    it('returns 200 OK and sets owt_age cookie when visitor confirms 21+ (confirmed21Plus = true)', async () => {
      const req = new NextRequest('http://localhost:3000/api/age-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '198.51.100.42',
          'user-agent': 'Vitest-Test-Runner/1.0',
        },
        body: JSON.stringify({ confirmed21Plus: true }),
      });

      const res = await ageVerifyPost(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.verified).toBe(true);
      expect(json.data.expiresAt).toBeDefined();

      // Verify Set-Cookie header contains owt_age
      const cookieHeader = res.headers.get('set-cookie');
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader).toContain(AGE_COOKIE_NAME);
      expect(cookieHeader).toContain('Path=/');
      expect(cookieHeader).toContain('HttpOnly');
    });

    it('GET /api/age-verify verifies active cookie session', async () => {
      const { token } = await signAgeToken();
      const req = new NextRequest('http://localhost:3000/api/age-verify', {
        headers: {
          cookie: `${AGE_COOKIE_NAME}=${token}`,
        },
      });

      const res = await ageVerifyGet(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.verified).toBe(true);
    });
  });

  describe('3. Edge Middleware Guard (AC-AGE-01 & AC-AGE-02)', () => {
    it('redirects unverified storefront visitor to /age-gate?next= (AC-AGE-01)', async () => {
      const req = new NextRequest('http://localhost:3000/shop');
      const res = await middleware(req);

      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toContain('/age-gate');
      expect(location).toContain('next=%2Fshop');
    });

    it('returns HTTP 451 AGE_GATE_REQUIRED for unverified API calls (AC-AGE-02)', async () => {
      const req = new NextRequest('http://localhost:3000/api/products');
      const res = await middleware(req);

      expect(res.status).toBe(451);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('AGE_GATE_REQUIRED');
    });

    it('allows unverified visitors to access public bypass routes', async () => {
      const bypassPaths = [
        'http://localhost:3000/age-gate',
        'http://localhost:3000/api/health',
        'http://localhost:3000/api/age-verify',
        'http://localhost:3000/api/webhooks/store-confirmation',
      ];

      for (const url of bypassPaths) {
        const req = new NextRequest(url);
        const res = await middleware(req);
        // Middleware allows request through without redirecting to /age-gate or 451
        expect(res.status).not.toBe(307);
        expect(res.status).not.toBe(451);
      }
    });

    it('allows verified visitor with valid HMAC cookie to access storefront routes (AC-AGE-03)', async () => {
      const { token } = await signAgeToken();
      const req = new NextRequest('http://localhost:3000/shop', {
        headers: {
          cookie: `${AGE_COOKIE_NAME}=${token}`,
        },
      });

      const res = await middleware(req);
      expect(res.status).not.toBe(307);
      expect(res.status).not.toBe(451);
    });

    it('rejects tampered cookie on storefront routes and redirects with cookie cleanup', async () => {
      const tamperedToken = 'deadbeef.123456789.badsignature';
      const req = new NextRequest('http://localhost:3000/shop', {
        headers: {
          cookie: `${AGE_COOKIE_NAME}=${tamperedToken}`,
        },
      });

      const res = await middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/age-gate');

      // Verify cookie cleanup is issued
      const setCookie = res.headers.get('set-cookie');
      expect(setCookie).toBeDefined();
      expect(setCookie).toContain(`${AGE_COOKIE_NAME}=;`);
    });
  });
});

