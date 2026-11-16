import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as loginRoute } from '../../app/api/admin/login/route';
import { POST as logoutRoute } from '../../app/api/admin/logout/route';
import { GET as meRoute } from '../../app/api/admin/me/route';
import { GET as getProductsRoute, POST as createProductRoute } from '../../app/api/admin/products/route';
import { GET as getInventoryRoute, PUT as updateInventoryRoute } from '../../app/api/admin/inventory/route';
import { GET as getDispensariesRoute, POST as createDispensaryRoute } from '../../app/api/admin/dispensaries/route';
import { GET as getBrandsRoute, POST as createBrandRoute } from '../../app/api/admin/brands/route';
import { GET as getOrdersRoute } from '../../app/api/admin/orders/route';
import { PATCH as updateSubOrderRoute } from '../../app/api/admin/sub-orders/[id]/route';
import * as authService from '../../server/admin/auth-service';
import * as productsService from '../../server/admin/products-service';
import * as inventoryService from '../../server/admin/inventory-service';
import * as dispensariesService from '../../server/admin/dispensaries-service';
import * as brandsService from '../../server/admin/brands-service';
import * as ordersService from '../../server/admin/orders-service';
import { ADMIN_COOKIE_NAME } from '../../server/admin/crypto';

vi.mock('../../server/admin/auth-service');
vi.mock('../../server/admin/products-service');
vi.mock('../../server/admin/inventory-service');
vi.mock('../../server/admin/dispensaries-service');
vi.mock('../../server/admin/brands-service');
vi.mock('../../server/admin/orders-service');

describe('Admin API Route Handlers (/api/admin/*)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/admin/login', () => {
    it('authenticates admin and sets owt_admin session cookie', async () => {
      vi.mocked(authService.adminLogin).mockResolvedValue({
        user: { id: 'adm-1', email: 'ops@owtlet.com', name: 'Ops', role: 'ADMIN' },
        token: 'signed-admin-token-xyz',
        expiresAt: new Date(Date.now() + 28800000),
      });

      const req = new NextRequest('http://localhost:3000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ops@owtlet.com', password: 'admin_password' }),
      });

      const res = await loginRoute(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.user.email).toBe('ops@owtlet.com');
      const setCookie = res.headers.get('set-cookie');
      expect(setCookie).toContain(ADMIN_COOKIE_NAME);
    });

    it('returns 400 when email or password is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '' }),
      });

      const res = await loginRoute(req);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/admin/logout', () => {
    it('clears the owt_admin cookie and returns success', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/logout', { method: 'POST' });
      const res = await logoutRoute(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      const setCookie = res.headers.get('set-cookie');
      expect(setCookie).toContain(`${ADMIN_COOKIE_NAME}=;`);
    });
  });

  describe('GET /api/admin/me', () => {
    it('returns active user when valid cookie is provided', async () => {
      vi.mocked(authService.getAdminFromToken).mockResolvedValue({
        id: 'adm-1',
        email: 'ops@owtlet.com',
        name: 'Ops',
        role: 'ADMIN',
      });

      const req = new NextRequest('http://localhost:3000/api/admin/me', {
        headers: { cookie: `${ADMIN_COOKIE_NAME}=valid-token` },
      });

      const res = await meRoute(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.user.email).toBe('ops@owtlet.com');
    });
  });

  describe('GET & POST /api/admin/products', () => {
    it('fetches products list with total count', async () => {
      vi.mocked(productsService.listAdminProducts).mockResolvedValue([
        { id: 'prod-1', name: 'Sour Diesel' } as any,
      ]);

      const req = new NextRequest('http://localhost:3000/api/admin/products?search=sour');
      const res = await getProductsRoute(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.items).toHaveLength(1);
      expect(json.data.total).toBe(1);
    });

    it('creates product and returns 201 Created', async () => {
      vi.mocked(productsService.createAdminProduct).mockResolvedValue({
        id: 'prod-2',
        name: 'OG Kush',
      } as any);

      const req = new NextRequest('http://localhost:3000/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'OG Kush', categoryId: 'cat-1' }),
      });

      const res = await createProductRoute(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data.name).toBe('OG Kush');
    });
  });

  describe('GET & PUT /api/admin/inventory', () => {
    it('bulk updates inventory and returns 200 OK', async () => {
      vi.mocked(inventoryService.bulkUpdateAdminInventory).mockResolvedValue({
        updatedCount: 2,
        items: [],
      });

      const req = new NextRequest('http://localhost:3000/api/admin/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            { productId: 'p1', dispensaryId: 'd1', stockQty: 10 },
            { productId: 'p2', dispensaryId: 'd1', stockQty: 15 },
          ],
        }),
      });

      const res = await updateInventoryRoute(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.updatedCount).toBe(2);
    });
  });

  describe('GET & POST /api/admin/dispensaries', () => {
    it('fetches dispensaries list', async () => {
      vi.mocked(dispensariesService.listAdminDispensaries).mockResolvedValue([
        { id: 'disp-1', name: 'Gotham Greenery' } as any,
      ]);

      const req = new NextRequest('http://localhost:3000/api/admin/dispensaries');
      const res = await getDispensariesRoute(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.items).toHaveLength(1);
    });
  });

  describe('GET & POST /api/admin/brands', () => {
    it('fetches brand channels list', async () => {
      vi.mocked(brandsService.listAdminBrands).mockResolvedValue([
        { id: 'brd-1', name: 'Lowell Farms' } as any,
      ]);

      const req = new NextRequest('http://localhost:3000/api/admin/brands');
      const res = await getBrandsRoute(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.items).toHaveLength(1);
    });
  });

  describe('PATCH /api/admin/sub-orders/[id]', () => {
    it('updates sub-order status', async () => {
      vi.mocked(ordersService.updateSubOrderStatus).mockResolvedValue({
        subOrder: { id: 'so-1', status: 'CONFIRMED' } as any,
        parentOrder: { id: 'ord-1', status: 'CONFIRMED' } as any,
      });

      const req = new NextRequest('http://localhost:3000/api/admin/sub-orders/so-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      });

      const res = await updateSubOrderRoute(req, { params: { id: 'so-1' } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.subOrder.status).toBe('CONFIRMED');
    });

    it('rejects invalid SubOrderStatus', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/sub-orders/so-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'INVALID_STATUS' }),
      });

      const res = await updateSubOrderRoute(req, { params: { id: 'so-1' } });
      expect(res.status).toBe(400);
    });
  });
});

