import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  signShopperToken,
  verifyShopperToken,
  hashPassword,
  verifyPassword,
  generatePasswordResetToken,
  hashResetToken,
  SHOPPER_COOKIE_NAME,
} from '../server/shopper-account/crypto';
import { checkRateLimit, resetRateLimit } from '../server/shopper-account/rate-limiter';
import {
  ConsoleOrSmtpMailer,
  getLastSentEmail,
  clearLastSentEmail,
} from '../server/shopper-account/mailer';
import {
  registerShopper,
  loginShopper,
  getShopperProfile,
  updateShopperProfile,
  listShopperAddresses,
  createShopperAddress,
  updateShopperAddress,
  deleteShopperAddress,
  requestPasswordReset,
  confirmPasswordReset,
  getShopperOrders,
} from '../server/shopper-account/service';
import { ShopperAccountError } from '../server/shopper-account/types';
import { prisma } from '../server/db';
import { CartStatus } from '@prisma/client';

// In-memory mock store for unit testing
const mockDb = {
  shoppers: [] as any[],
  addresses: [] as any[],
  carts: [] as any[],
  cartItems: [] as any[],
  dispensaries: [
    {
      id: 'disp-111',
      name: 'Gotham Greenery NYC',
      slug: 'gotham-greenery',
      address: '123 Bowery',
      city: 'New York',
      zip: '10002',
      offersPickup: true,
      offersDelivery: true,
      isActive: true,
    },
    {
      id: 'disp-inactive',
      name: 'Closed Dispensary',
      slug: 'closed-store',
      address: '999 Closed St',
      city: 'New York',
      zip: '10001',
      offersPickup: true,
      offersDelivery: false,
      isActive: false,
    },
  ] as any[],
  resetTokens: [] as any[],
  orders: [] as any[],
};

vi.mock('../server/db', () => ({
  prisma: {
    $transaction: vi.fn(async (cb: any) => {
      return await cb(prisma);
    }),
    shopper: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.id) {
          const s = mockDb.shoppers.find((item) => item.id === where.id);
          if (!s) return null;
          const defaultDispensary = mockDb.dispensaries.find((d) => d.id === s.defaultDispensaryId) || null;
          return { ...s, defaultDispensary };
        }
        if (where.email) {
          const s = mockDb.shoppers.find((item) => item.email.toLowerCase() === where.email.toLowerCase());
          if (!s) return null;
          const defaultDispensary = mockDb.dispensaries.find((d) => d.id === s.defaultDispensaryId) || null;
          return { ...s, defaultDispensary };
        }
        return null;
      }),
      create: vi.fn(async ({ data }: any) => {
        const newShopper = {
          id: `shopper-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          defaultDispensary: null,
        };
        mockDb.shoppers.push(newShopper);
        return newShopper;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const idx = mockDb.shoppers.findIndex((s) => s.id === where.id);
        if (idx === -1) throw new Error('Shopper not found');
        mockDb.shoppers[idx] = {
          ...mockDb.shoppers[idx],
          ...data,
          updatedAt: new Date(),
        };
        const defaultDispensary =
          mockDb.dispensaries.find((d) => d.id === mockDb.shoppers[idx].defaultDispensaryId) || null;
        return { ...mockDb.shoppers[idx], defaultDispensary };
      }),
    },
    shopperAddress: {
      findMany: vi.fn(async ({ where, orderBy }: any) => {
        let list = mockDb.addresses.filter((a) => a.shopperId === where.shopperId);
        if (orderBy) {
          list.sort((a, b) => {
            if (a.isDefault && !b.isDefault) return -1;
            if (!a.isDefault && b.isDefault) return 1;
            return b.createdAt.getTime() - a.createdAt.getTime();
          });
        }
        return list;
      }),
      findFirst: vi.fn(async ({ where }: any) => {
        return mockDb.addresses.find((a) => {
          if (where.id && a.id !== where.id) return false;
          if (where.shopperId && a.shopperId !== where.shopperId) return false;
          return true;
        }) || null;
      }),
      count: vi.fn(async ({ where }: any) => {
        return mockDb.addresses.filter((a) => a.shopperId === where.shopperId).length;
      }),
      create: vi.fn(async ({ data }: any) => {
        const newAddr = {
          id: `addr-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          ...data,
          createdAt: new Date(),
        };
        mockDb.addresses.push(newAddr);
        return newAddr;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const idx = mockDb.addresses.findIndex((a) => a.id === where.id);
        if (idx === -1) throw new Error('Address not found');
        mockDb.addresses[idx] = { ...mockDb.addresses[idx], ...data };
        return mockDb.addresses[idx];
      }),
      updateMany: vi.fn(async ({ where, data }: any) => {
        let count = 0;
        mockDb.addresses.forEach((a) => {
          if (a.shopperId === where.shopperId) {
            if (where.id && where.id.not && a.id === where.id.not) return;
            Object.assign(a, data);
            count++;
          }
        });
        return { count };
      }),
      delete: vi.fn(async ({ where }: any) => {
        const idx = mockDb.addresses.findIndex((a) => a.id === where.id);
        if (idx !== -1) mockDb.addresses.splice(idx, 1);
        return { count: 1 };
      }),
    },
    dispensary: {
      findUnique: vi.fn(async ({ where }: any) => {
        return mockDb.dispensaries.find((d) => d.id === where.id) || null;
      }),
      findFirst: vi.fn(async ({ where }: any) => {
        return mockDb.dispensaries.find((d) => {
          if (where.isActive !== undefined && d.isActive !== where.isActive) return false;
          return true;
        }) || null;
      }),
    },
    cart: {
      findUnique: vi.fn(async ({ where }: any) => {
        const cart = mockDb.carts.find((c) => {
          if (where.id) return c.id === where.id;
          if (where.sessionToken) return c.sessionToken === where.sessionToken;
          return false;
        });
        if (!cart) return null;
        const items = mockDb.cartItems.filter((i) => i.cartId === cart.id);
        return { ...cart, items };
      }),
      findFirst: vi.fn(async ({ where }: any) => {
        const cart = mockDb.carts.find((c) => {
          if (where.shopperId && c.shopperId !== where.shopperId) return false;
          if (where.status && c.status !== where.status) return false;
          if (where.id && where.id.not && c.id === where.id.not) return false;
          return true;
        });
        if (!cart) return null;
        const items = mockDb.cartItems.filter((i) => i.cartId === cart.id);
        return { ...cart, items };
      }),
      findMany: vi.fn(async ({ where }: any) => {
        const carts = mockDb.carts.filter((c) => {
          if (where.shopperId && c.shopperId !== where.shopperId) return false;
          if (where.status && c.status !== where.status) return false;
          return true;
        });
        return carts.map((c) => ({
          ...c,
          items: mockDb.cartItems.filter((i) => i.cartId === c.id),
        }));
      }),
      create: vi.fn(async ({ data }: any) => {
        const newCart = {
          id: `cart-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          ...data,
          lastActivityAt: new Date(),
          items: [],
        };
        mockDb.carts.push(newCart);
        return newCart;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const idx = mockDb.carts.findIndex((c) => c.id === where.id);
        if (idx !== -1) {
          mockDb.carts[idx] = { ...mockDb.carts[idx], ...data };
          return mockDb.carts[idx];
        }
        return null;
      }),
    },
    cartItem: {
      create: vi.fn(async ({ data }: any) => {
        const newItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          ...data,
        };
        mockDb.cartItems.push(newItem);
        return newItem;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const idx = mockDb.cartItems.findIndex((i) => i.id === where.id);
        if (idx !== -1) {
          mockDb.cartItems[idx] = { ...mockDb.cartItems[idx], ...data };
          return mockDb.cartItems[idx];
        }
        return null;
      }),
    },
    passwordResetToken: {
      findUnique: vi.fn(async ({ where }: any) => {
        const r = mockDb.resetTokens.find((t) => t.tokenHash === where.tokenHash);
        if (!r) return null;
        const shopper = mockDb.shoppers.find((s) => s.id === r.shopperId);
        return { ...r, shopper };
      }),
      create: vi.fn(async ({ data }: any) => {
        const record = {
          id: `tok-${Date.now()}`,
          usedAt: null,
          ...data,
        };
        mockDb.resetTokens.push(record);
        return record;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const idx = mockDb.resetTokens.findIndex((t) => t.id === where.id);
        if (idx !== -1) {
          mockDb.resetTokens[idx] = { ...mockDb.resetTokens[idx], ...data };
          return mockDb.resetTokens[idx];
        }
        return null;
      }),
      deleteMany: vi.fn(async ({ where }: any) => {
        let count = 0;
        mockDb.resetTokens = mockDb.resetTokens.filter((t) => {
          if (t.shopperId === where.shopperId && t.usedAt === null) {
            count++;
            return false;
          }
          return true;
        });
        return { count };
      }),
    },
    order: {
      findMany: vi.fn(async ({ where }: any) => {
        return mockDb.orders.filter((o) => o.shopperId === where.shopperId);
      }),
    },
  },
}));

describe('Shopper Account Security & Crypto (docs/10 §1, AC-PRF-02)', () => {
  it('signs and verifies valid owt_shopper session tokens', async () => {
    const shopperId = 'test-shopper-123';
    const { token, expiresAt } = await signShopperToken({ shopperId });

    expect(token).toBeDefined();
    expect(token.split('.').length).toBe(3);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

    const verified = await verifyShopperToken(token);
    expect(verified.valid).toBe(true);
    expect(verified.shopperId).toBe(shopperId);
  });

  it('rejects expired, tampered, or malformed shopper session tokens', async () => {
    // Malformed
    const malformed = await verifyShopperToken('invalid.token');
    expect(malformed.valid).toBe(false);
    expect(malformed.reason).toBe('MALFORMED');

    // Expired
    const { token } = await signShopperToken({ shopperId: 'exp-user' }, undefined, -1000);
    const expired = await verifyShopperToken(token);
    expect(expired.valid).toBe(false);
    expect(expired.reason).toBe('EXPIRED');

    // Tampered signature
    const parts = token.split('.');
    parts[2] = 'deadbeef'.repeat(8);
    const tampered = await verifyShopperToken(parts.join('.'));
    expect(tampered.valid).toBe(false);
  });

  it('hashes passwords using argon2id and verifies correctly', async () => {
    const rawPass = 'SuperSecurePass123!';
    const hash = await hashPassword(rawPass);

    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await verifyPassword(hash, rawPass)).toBe(true);
    expect(await verifyPassword(hash, 'WrongPassword123!')).toBe(false);
  });

  it('generates single-use password reset tokens with SHA-256 hashes', () => {
    const { token, tokenHash, expiresAt } = generatePasswordResetToken(1);

    expect(token).toHaveLength(64); // 32 random bytes hex
    expect(tokenHash).toHaveLength(64); // SHA-256 hex
    expect(tokenHash).toBe(hashResetToken(token));
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe('Rate Limiter (docs/08 §13, docs/10 §1)', () => {
  beforeEach(() => {
    resetRateLimit();
  });

  it('allows 5 requests per minute and blocks the 6th', () => {
    const key = 'test:login:shopper@example.com';
    for (let i = 0; i < 5; i++) {
      const res = checkRateLimit(key, 5, 60000);
      expect(res.allowed).toBe(true);
    }

    const blocked = checkRateLimit(key, 5, 60000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetMs).toBeGreaterThan(0);
  });
});

describe('Mailer Interface (TASK-021 step 2)', () => {
  beforeEach(() => {
    clearLastSentEmail();
  });

  it('records last sent email in ConsoleOrSmtpMailer fallback', async () => {
    const mailer = new ConsoleOrSmtpMailer();
    await mailer.sendPasswordResetEmail('shopper@owtlet.com', 'https://owtlet.com/account/reset?token=xyz');

    const sent = getLastSentEmail();
    expect(sent).not.toBeNull();
    expect(sent?.to).toBe('shopper@owtlet.com');
    expect(sent?.resetUrl).toContain('token=xyz');
  });
});

describe('Shopper Account Services (AC-PRF-01, AC-PRF-02, AC-SEL-02, T-PRF-01)', () => {
  const testEmail = `shopper-${Date.now()}@example.com`;
  let createdShopperId: string;
  const activeStoreId = 'disp-111';

  beforeEach(() => {
    resetRateLimit();
  });

  it('registers a new shopper, hashes password, and associates active cart', async () => {
    // Create an anonymous cart in mock
    const anonCart = {
      id: 'anon-cart-1',
      sessionToken: 'anon-session-123',
      status: CartStatus.ACTIVE,
      shopperId: null,
    };
    mockDb.carts.push(anonCart);

    const result = await registerShopper(
      {
        email: testEmail,
        password: 'Password12345!',
        firstName: 'Alex',
        lastName: 'Green',
        phone: '212-555-0144',
        homeZip: '10001',
      },
      anonCart.sessionToken
    );

    expect(result.shopper.id).toBeDefined();
    expect(result.shopper.email).toBe(testEmail.toLowerCase());
    expect(result.shopper.firstName).toBe('Alex');
    expect(result.shopper.lastName).toBe('Green');
    expect(result.token).toBeDefined();

    // Verify passwordHash is never returned in DTO
    expect((result.shopper as any).passwordHash).toBeUndefined();

    createdShopperId = result.shopper.id;

    // Verify cart was associated
    const associatedCart = mockDb.carts.find((c) => c.id === anonCart.id);
    expect(associatedCart?.shopperId).toBe(createdShopperId);
  });

  it('rejects registering with an already existing email address (409 EMAIL_TAKEN)', async () => {
    await expect(
      registerShopper({
        email: testEmail,
        password: 'AnotherPassword123!',
      })
    ).rejects.toThrowError(ShopperAccountError);
  });

  it('authenticates registered shopper and merges anonymous cart with item capping (10)', async () => {
    // Clear old test carts
    mockDb.carts = [];
    mockDb.cartItems = [];

    const productId = 'prod-canna-1';

    // Anonymous cart with 8 items
    const anonCart = {
      id: 'anon-cart-merge',
      sessionToken: 'anon-token-merge',
      status: CartStatus.ACTIVE,
      shopperId: null,
    };
    mockDb.carts.push(anonCart);
    mockDb.cartItems.push({
      id: 'anon-item-1',
      cartId: anonCart.id,
      productId,
      quantity: 8,
      unitPrice: 50.0,
      channelBrandId: null,
    });

    // Existing active shopper cart with 4 items of the same product
    const shopperCart = {
      id: 'shopper-cart-1',
      sessionToken: 'shopper-session-token',
      shopperId: createdShopperId,
      status: CartStatus.ACTIVE,
    };
    mockDb.carts.push(shopperCart);
    mockDb.cartItems.push({
      id: 'shopper-item-1',
      cartId: shopperCart.id,
      productId,
      quantity: 4,
      unitPrice: 50.0,
      channelBrandId: null,
    });

    const loginRes = await loginShopper(
      {
        email: testEmail,
        password: 'Password12345!',
      },
      anonCart.sessionToken
    );

    expect(loginRes.shopper.id).toBe(createdShopperId);

    // Verify item quantity merged and capped at 10 (4 + 8 = 12 -> 10)
    const mergedItem = mockDb.cartItems.find((i) => i.id === 'shopper-item-1');
    expect(mergedItem?.quantity).toBe(10);

    // Anonymous cart should be marked EXPIRED
    const expiredCart = mockDb.carts.find((c) => c.id === anonCart.id);
    expect(expiredCart?.status).toBe(CartStatus.EXPIRED);
  });

  it('retrieves shopper profile and updates homeZip and default partner dispensary (AC-SEL-02)', async () => {
    const profile = await getShopperProfile(createdShopperId);
    expect(profile.id).toBe(createdShopperId);

    const updated = await updateShopperProfile(createdShopperId, {
      homeZip: '11201',
      defaultDispensaryId: activeStoreId,
    });

    expect(updated.homeZip).toBe('11201');
    expect(updated.defaultDispensaryId).toBe(activeStoreId);
    expect(updated.defaultDispensary?.id).toBe(activeStoreId);
  });

  it('rejects setting an inactive or non-existent dispensary as default (422 INVALID_DISPENSARY)', async () => {
    await expect(
      updateShopperProfile(createdShopperId, {
        defaultDispensaryId: 'disp-inactive',
      })
    ).rejects.toThrowError('Selected store is not an active partner dispensary');
  });

  it('manages saved addresses: creates, lists, updates, and deletes with single default invariant', async () => {
    // 1. First address automatically becomes default
    const addr1 = await createShopperAddress(createdShopperId, {
      label: 'Home',
      line1: '123 Bowery',
      line2: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      zip: '10002',
    });
    expect(addr1.isDefault).toBe(true);

    // 2. Second address without isDefault stays non-default
    const addr2 = await createShopperAddress(createdShopperId, {
      label: 'Office',
      line1: '450 Lexington Ave',
      city: 'New York',
      state: 'NY',
      zip: '10017',
      isDefault: false,
    });
    expect(addr2.isDefault).toBe(false);

    // 3. Setting addr2 as default unsets addr1 default
    const updatedAddr2 = await updateShopperAddress(createdShopperId, addr2.id, {
      isDefault: true,
    });
    expect(updatedAddr2.isDefault).toBe(true);

    const addresses = await listShopperAddresses(createdShopperId);
    expect(addresses.length).toBe(2);
    expect(addresses[0].id).toBe(addr2.id); // Default listed first
    expect(addresses[0].isDefault).toBe(true);
    expect(addresses[1].isDefault).toBe(false);

    // 4. Deleting default address makes the remaining address default
    await deleteShopperAddress(createdShopperId, addr2.id);

    const remaining = await listShopperAddresses(createdShopperId);
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe(addr1.id);
    expect(remaining[0].isDefault).toBe(true);
  });

  it('handles single-use password reset lifecycle with 1-hour expiration', async () => {
    clearLastSentEmail();

    // 1. Request reset
    const reqRes = await requestPasswordReset(
      { email: testEmail },
      'https://owtlet.com'
    );
    expect(reqRes.success).toBe(true);

    const emailRecord = getLastSentEmail();
    expect(emailRecord).not.toBeNull();
    const tokenMatch = emailRecord?.resetUrl.match(/token=([a-f0-9]{64})/);
    expect(tokenMatch).not.toBeNull();
    const rawToken = tokenMatch![1];

    // 2. Confirm reset
    const newPassword = 'BrandNewPassword999!';
    const confirmRes = await confirmPasswordReset({
      token: rawToken,
      password: newPassword,
    });
    expect(confirmRes.success).toBe(true);

    // 3. Old password fails, new password succeeds
    await expect(
      loginShopper({ email: testEmail, password: 'Password12345!' })
    ).rejects.toThrowError('Invalid email address or password');

    const newLogin = await loginShopper({ email: testEmail, password: newPassword });
    expect(newLogin.shopper.id).toBe(createdShopperId);

    // 4. Token cannot be reused (single-use protection)
    await expect(
      confirmPasswordReset({
        token: rawToken,
        password: 'AnotherPassword123!',
      })
    ).rejects.toThrowError('Password reset link is invalid or has expired');
  });

  it('retrieves orders for authenticated shopper', async () => {
    // Add a mock order for the shopper
    mockDb.orders.push({
      id: 'order-1',
      orderNumber: 'OWT-100234',
      fulfillmentType: 'DELIVERY',
      status: 'CONFIRMED',
      subtotal: { toFixed: () => '120.00' },
      zip: '10001',
      createdAt: new Date(),
      shopperId: createdShopperId,
      subOrders: [],
    });

    const orders = await getShopperOrders(createdShopperId);
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBe(1);
    expect(orders[0].orderNumber).toBe('OWT-100234');
  });
});
