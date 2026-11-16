import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/server/shopper-account', () => {
  return {
    registerShopper: vi.fn(),
    loginShopper: vi.fn(),
    getShopperProfile: vi.fn(),
    updateShopperProfile: vi.fn(),
    listShopperAddresses: vi.fn(),
    createShopperAddress: vi.fn(),
    updateShopperAddress: vi.fn(),
    deleteShopperAddress: vi.fn(),
    requestPasswordReset: vi.fn(),
    confirmPasswordReset: vi.fn(),
    getShopperOrders: vi.fn(),
    verifyShopperToken: vi.fn(),
    SHOPPER_COOKIE_NAME: 'owt_shopper',
    SHOPPER_COOKIE_OPTIONS: { httpOnly: true, path: '/' },
    registerShopperSchema: {
      safeParse: vi.fn((body: any) => {
        if (!body.email || !body.password || body.password.length < 10) {
          return { success: false, error: { errors: [{ path: ['password'], message: 'Min 10 chars' }] } };
        }
        return { success: true, data: body };
      }),
    },
    loginShopperSchema: {
      safeParse: vi.fn((body: any) => {
        if (!body.email || !body.password) {
          return { success: false, error: { errors: [{ path: ['email'], message: 'Required' }] } };
        }
        return { success: true, data: body };
      }),
    },
    updateShopperProfileSchema: {
      safeParse: vi.fn((body: any) => ({ success: true, data: body })),
    },
    shopperAddressSchema: {
      safeParse: vi.fn((body: any) => {
        if (!body.line1 || !body.city || !body.zip) {
          return { success: false, error: { errors: [{ path: ['line1'], message: 'Required' }] } };
        }
        return { success: true, data: body };
      }),
    },
    updateShopperAddressSchema: {
      safeParse: vi.fn((body: any) => ({ success: true, data: body })),
    },
    requestPasswordResetSchema: {
      safeParse: vi.fn((body: any) => {
        if (!body.email) {
          return { success: false, error: { errors: [{ path: ['email'], message: 'Required' }] } };
        }
        return { success: true, data: body };
      }),
    },
    confirmPasswordResetSchema: {
      safeParse: vi.fn((body: any) => {
        if (!body.token || !body.password) {
          return { success: false, error: { errors: [{ path: ['token'], message: 'Required' }] } };
        }
        return { success: true, data: body };
      }),
    },
    ShopperAccountError: class ShopperAccountError extends Error {
      constructor(public code: string, message: string, public status: number = 400) {
        super(message);
        this.name = 'ShopperAccountError';
      }
    },
  };
});

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
  verifyShopperToken,
  ShopperAccountError,
} from '@/server/shopper-account';

import { POST as registerHandler } from '@/app/api/account/register/route';
import { POST as loginHandler } from '@/app/api/account/login/route';
import { POST as logoutHandler } from '@/app/api/account/logout/route';
import { GET as getProfileHandler, PATCH as updateProfileHandler } from '@/app/api/account/profile/route';
import { GET as getAddressesHandler, POST as createAddressHandler } from '@/app/api/account/addresses/route';
import { PATCH as updateAddressHandler, DELETE as deleteAddressHandler } from '@/app/api/account/addresses/[id]/route';
import { POST as requestResetHandler } from '@/app/api/account/password-reset/request/route';
import { POST as confirmResetHandler } from '@/app/api/account/password-reset/confirm/route';
import { GET as getOrdersHandler } from '@/app/api/account/orders/route';

describe('Account Route Handlers (docs/08 §13, AC-PRF-01, AC-PRF-02, AC-SEL-02)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProfile = {
    id: 'shopper-123',
    email: 'shopper@example.com',
    firstName: 'Alex',
    lastName: 'Taylor',
    phone: '212-555-0100',
    homeZip: '10001',
    defaultDispensaryId: 'disp-1',
    defaultDispensary: {
      id: 'disp-1',
      name: 'Gotham Greenery NYC',
      slug: 'gotham-greenery',
      address: '123 Bowery',
      city: 'New York',
      zip: '10002',
      offersPickup: true,
      offersDelivery: true,
    },
    createdAt: '2026-11-16T12:00:00.000Z',
  };

  it('POST /api/account/register creates account and sets owt_shopper cookie', async () => {
    (registerShopper as any).mockResolvedValue({
      shopper: mockProfile,
      token: 'signed.shopper.token',
      expiresAt: new Date(Date.now() + 30 * 86400000),
    });

    const req = new NextRequest('http://localhost:3000/api/account/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'shopper@example.com',
        password: 'Password12345!',
        firstName: 'Alex',
      }),
    });

    const res = await registerHandler(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.shopper.email).toBe('shopper@example.com');
    expect(res.cookies.get('owt_shopper')?.value).toBe('signed.shopper.token');
  });

  it('POST /api/account/login authenticates and sets session cookie', async () => {
    (loginShopper as any).mockResolvedValue({
      shopper: mockProfile,
      token: 'login.token.123',
      expiresAt: new Date(Date.now() + 30 * 86400000),
    });

    const req = new NextRequest('http://localhost:3000/api/account/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'shopper@example.com',
        password: 'Password12345!',
      }),
    });

    const res = await loginHandler(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(res.cookies.get('owt_shopper')?.value).toBe('login.token.123');
  });

  it('POST /api/account/logout clears session cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/logout', { method: 'POST' });
    const res = await logoutHandler(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(res.cookies.get('owt_shopper')?.value).toBe('');
  });

  it('GET /api/account/profile returns 401 when unauthenticated and 200 when authenticated', async () => {
    // Unauthenticated
    (verifyShopperToken as any).mockResolvedValue({ valid: false });
    const unauthReq = new NextRequest('http://localhost:3000/api/account/profile');
    const unauthRes = await getProfileHandler(unauthReq);
    expect(unauthRes.status).toBe(401);

    // Authenticated
    (verifyShopperToken as any).mockResolvedValue({ valid: true, shopperId: 'shopper-123' });
    (getShopperProfile as any).mockResolvedValue(mockProfile);

    const authReq = new NextRequest('http://localhost:3000/api/account/profile', {
      headers: { cookie: 'owt_shopper=valid.token' },
    });
    const authRes = await getProfileHandler(authReq);
    const json = await authRes.json();

    expect(authRes.status).toBe(200);
    expect(json.data.id).toBe('shopper-123');
  });

  it('PATCH /api/account/profile updates profile data', async () => {
    (verifyShopperToken as any).mockResolvedValue({ valid: true, shopperId: 'shopper-123' });
    (updateShopperProfile as any).mockResolvedValue({
      ...mockProfile,
      homeZip: '11201',
    });

    const req = new NextRequest('http://localhost:3000/api/account/profile', {
      method: 'PATCH',
      headers: { cookie: 'owt_shopper=valid.token' },
      body: JSON.stringify({ homeZip: '11201' }),
    });

    const res = await updateProfileHandler(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.homeZip).toBe('11201');
  });

  it('Address CRUD route handlers function as expected', async () => {
    (verifyShopperToken as any).mockResolvedValue({ valid: true, shopperId: 'shopper-123' });

    // GET /addresses
    (listShopperAddresses as any).mockResolvedValue([
      { id: 'addr-1', line1: '123 Bowery', city: 'New York', state: 'NY', zip: '10002', isDefault: true },
    ]);
    const listRes = await getAddressesHandler(new NextRequest('http://localhost:3000/api/account/addresses', {
      headers: { cookie: 'owt_shopper=valid.token' },
    }));
    const listJson = await listRes.json();
    expect(listJson.data.items).toHaveLength(1);

    // POST /addresses
    (createShopperAddress as any).mockResolvedValue({
      id: 'addr-2',
      line1: '450 Lex',
      city: 'New York',
      state: 'NY',
      zip: '10017',
      isDefault: false,
    });
    const createRes = await createAddressHandler(new NextRequest('http://localhost:3000/api/account/addresses', {
      method: 'POST',
      headers: { cookie: 'owt_shopper=valid.token' },
      body: JSON.stringify({ line1: '450 Lex', city: 'New York', state: 'NY', zip: '10017' }),
    }));
    expect(createRes.status).toBe(201);

    // PATCH /addresses/:id
    (updateShopperAddress as any).mockResolvedValue({
      id: 'addr-2',
      line1: '450 Lex Ave',
      city: 'New York',
      state: 'NY',
      zip: '10017',
      isDefault: true,
    });
    const patchRes = await updateAddressHandler(
      new NextRequest('http://localhost:3000/api/account/addresses/addr-2', {
        method: 'PATCH',
        headers: { cookie: 'owt_shopper=valid.token' },
        body: JSON.stringify({ line1: '450 Lex Ave', isDefault: true }),
      }),
      { params: { id: 'addr-2' } }
    );
    expect(patchRes.status).toBe(200);

    // DELETE /addresses/:id
    (deleteShopperAddress as any).mockResolvedValue({ success: true });
    const deleteRes = await deleteAddressHandler(
      new NextRequest('http://localhost:3000/api/account/addresses/addr-2', {
        method: 'DELETE',
        headers: { cookie: 'owt_shopper=valid.token' },
      }),
      { params: { id: 'addr-2' } }
    );
    expect(deleteRes.status).toBe(200);
  });

  it('Password reset route handlers function as expected', async () => {
    // Request reset
    (requestPasswordReset as any).mockResolvedValue({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
    const reqRes = await requestResetHandler(new NextRequest('http://localhost:3000/api/account/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ email: 'shopper@example.com' }),
    }));
    const reqJson = await reqRes.json();
    expect(reqRes.status).toBe(200);
    expect(reqJson.message).toContain('password reset link has been sent');

    // Confirm reset
    (confirmPasswordReset as any).mockResolvedValue({ success: true });
    const confirmRes = await confirmResetHandler(new NextRequest('http://localhost:3000/api/account/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ token: 'tok-123', password: 'NewSecurePassword123!' }),
    }));
    expect(confirmRes.status).toBe(200);
  });

  it('GET /api/account/orders returns order list for authenticated shopper', async () => {
    (verifyShopperToken as any).mockResolvedValue({ valid: true, shopperId: 'shopper-123' });
    (getShopperOrders as any).mockResolvedValue([
      { id: 'ord-1', orderNumber: 'OWT-100245', status: 'CONFIRMED', subtotal: '150.00', subOrders: [] },
    ]);

    const res = await getOrdersHandler(new NextRequest('http://localhost:3000/api/account/orders', {
      headers: { cookie: 'owt_shopper=valid.token' },
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.items).toHaveLength(1);
    expect(json.data.items[0].orderNumber).toBe('OWT-100245');
  });
});

