import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  signAdminToken,
  verifyAdminToken,
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_OPTIONS,
} from '../server/admin/crypto';
import { adminLogin, getAdminFromToken, AdminAuthError } from '../server/admin/auth-service';
import { prisma } from '../server/db';
import * as argon2 from 'argon2';

vi.mock('../server/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Admin Authentication & Session Security (docs/10 §1, AC-ADM-01)', () => {
  const secret = 'test_admin_session_secret_min_32_chars_long!';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Cryptographic HMAC Token Signing & Verification (crypto.ts)', () => {
    it('signs an admin session token with 8h TTL and HMAC-SHA256 signature', async () => {
      const { token, expiresAt } = await signAdminToken(
        { userId: 'usr-admin-1', role: 'ADMIN' },
        secret
      );

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(4);
      expect(token.startsWith('usr-admin-1.ADMIN.')).toBe(true);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('verifies a freshly signed admin token as valid', async () => {
      const { token } = await signAdminToken(
        { userId: 'usr-admin-2', role: 'SUPERADMIN' },
        secret
      );

      const result = await verifyAdminToken(token, secret);
      expect(result.valid).toBe(true);
      expect(result.userId).toBe('usr-admin-2');
      expect(result.role).toBe('SUPERADMIN');
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('rejects missing or empty tokens with reason MISSING', async () => {
      const result = await verifyAdminToken(undefined, secret);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('MISSING');
    });

    it('rejects malformed tokens with reason MALFORMED', async () => {
      const result = await verifyAdminToken('invalid.token.structure', secret);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('MALFORMED');
    });

    it('rejects expired tokens with reason EXPIRED', async () => {
      const { token } = await signAdminToken(
        { userId: 'usr-admin-3', role: 'ADMIN' },
        secret,
        -1000 // Expired 1 second ago
      );

      const result = await verifyAdminToken(token, secret);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('EXPIRED');
    });

    it('rejects tampered tokens with reason INVALID_SIGNATURE', async () => {
      const { token } = await signAdminToken(
        { userId: 'usr-admin-4', role: 'ADMIN' },
        secret
      );

      const parts = token.split('.');
      parts[0] = 'hacked-user-id'; // Tamper payload
      const tamperedToken = parts.join('.');

      const result = await verifyAdminToken(tamperedToken, secret);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('INVALID_SIGNATURE');
    });

    it('rejects tokens signed with a different secret', async () => {
      const { token } = await signAdminToken(
        { userId: 'usr-admin-5', role: 'ADMIN' },
        secret
      );

      const result = await verifyAdminToken(token, 'different_secret_key_min_32_chars_123');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('INVALID_SIGNATURE');
    });
  });

  describe('2. Admin Login & Authorization Service (auth-service.ts)', () => {
    it('successfully logs in with valid credentials and returns user and token', async () => {
      const hashedPassword = await argon2.hash('valid_admin_password_123');

      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'admin-uuid-1',
        email: 'ops@owtlet.com',
        name: 'Owtlet Operator',
        role: 'ADMIN',
        passwordHash: hashedPassword,
        isActive: true,
      });

      const result = await adminLogin('ops@owtlet.com', 'valid_admin_password_123');

      expect(result.user).toEqual({
        id: 'admin-uuid-1',
        email: 'ops@owtlet.com',
        name: 'Owtlet Operator',
        role: 'ADMIN',
      });
      expect(result.token).toBeDefined();
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('rejects login when password does not match', async () => {
      const hashedPassword = await argon2.hash('valid_admin_password_123');

      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'admin-uuid-1',
        email: 'ops@owtlet.com',
        name: 'Owtlet Operator',
        role: 'ADMIN',
        passwordHash: hashedPassword,
        isActive: true,
      });

      await expect(adminLogin('ops@owtlet.com', 'wrong_password')).rejects.toThrow(
        AdminAuthError
      );
    });

    it('rejects login when user is not found or inactive', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(adminLogin('missing@owtlet.com', 'some_password')).rejects.toThrow(
        AdminAuthError
      );
    });

    it('rejects login if user lacks ADMIN/SUPERADMIN role', async () => {
      const hashedPassword = await argon2.hash('shopper_password');

      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'user-shopper-1',
        email: 'shopper@example.com',
        role: 'DISPENSARY_OPERATOR',
        passwordHash: hashedPassword,
        isActive: true,
      });

      await expect(adminLogin('shopper@example.com', 'shopper_password')).rejects.toThrow(
        'Administrative privilege required'
      );
    });

    it('retrieves user profile from active session token', async () => {
      const { token } = await signAdminToken({
        userId: 'admin-uuid-1',
        role: 'ADMIN',
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'admin-uuid-1',
        email: 'ops@owtlet.com',
        name: 'Owtlet Operator',
        role: 'ADMIN',
        isActive: true,
      });

      const user = await getAdminFromToken(token);
      expect(user.id).toBe('admin-uuid-1');
      expect(user.email).toBe('ops@owtlet.com');
    });
  });
});

