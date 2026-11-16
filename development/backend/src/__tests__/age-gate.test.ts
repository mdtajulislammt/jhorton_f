import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  signAgeToken,
  verifyAgeToken,
  AGE_COOKIE_NAME,
  AGE_COOKIE_TTL_MS,
} from '../server/age-session/crypto';

// Mock DB call in age-session index
vi.mock('@/server/db', () => ({
  db: {
    ageVerificationSession: {
      upsert: vi.fn().mockResolvedValue({ id: 'test-session-id' }),
    },
  },
}));

describe('21+ Age Gate Cryptographic System (AC-AGE-01, AC-AGE-02, AC-AGE-03)', () => {
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
      expect(parts[2]).toHaveLength(64); // SHA-256 hex signature
      expect(expiresAt.getTime()).toBe(parsedExp);
    });

    it('verifies a valid signed age token successfully', async () => {
      const { token, expiresAt } = await signAgeToken();
      const result = await verifyAgeToken(token);

      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(result.expiresAt).toBeDefined();
      expect(result.expiresAt?.getTime()).toBe(expiresAt.getTime());
    });

    it('rejects null or empty tokens with MISSING reason', async () => {
      expect((await verifyAgeToken(null)).valid).toBe(false);
      expect((await verifyAgeToken(null)).reason).toBe('MISSING');
      expect((await verifyAgeToken('')).valid).toBe(false);
      expect((await verifyAgeToken('   ')).reason).toBe('MISSING');
    });

    it('rejects malformed tokens that do not have 3 dot-separated parts', async () => {
      const badTokens = ['invalid-token', 'part1.part2', 'part1.part2.part3.part4', '..'];

      for (const t of badTokens) {
        const result = await verifyAgeToken(t);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('MALFORMED');
      }
    });

    it('rejects tokens where expiration is not a valid number', async () => {
      const result = await verifyAgeToken('validnonce1234567890123456789012.notanumber.signature');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('MALFORMED');
    });

    it('rejects expired age tokens with EXPIRED reason', async () => {
      // Create a token expired 1 hour ago
      const pastTtl = -1 * 60 * 60 * 1000;
      const { token } = await signAgeToken(undefined, pastTtl);

      const result = await verifyAgeToken(token);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('EXPIRED');
    });

    it('rejects tampered tokens with INVALID_SIGNATURE reason', async () => {
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
});
