import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/server/products', () => ({
  listProducts: vi.fn(),
  getProductBySlug: vi.fn(),
  resolveProduct: vi.fn(),
}));

import { listProducts, getProductBySlug, resolveProduct } from '@/server/products';
import { GET as getProducts } from '@/app/api/products/route';
import { GET as getProductDetail } from '@/app/api/products/[slug]/route';
import { GET as getProductResolve } from '@/app/api/products/resolve/route';

describe('Products Route Handlers (docs/08-api-contract.md §3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('returns 200 with list of products on valid query', async () => {
      const mockResult = {
        items: [
          {
            id: 'prod-1',
            slug: 'blue-dream',
            name: 'Blue Dream 3.5g',
            priceMode: 'OWTLET',
            owtletPrice: '50.00',
            fromPrice: '50.00',
            availableAtCount: 2,
          },
        ],
        nextCursor: null,
      };
      (listProducts as any).mockResolvedValue(mockResult);

      const req = new NextRequest('http://localhost:3000/api/products?category=flower&limit=10');
      const res = await getProducts(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.items).toHaveLength(1);
      expect(json.data.items[0].slug).toBe('blue-dream');
      expect(listProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'flower',
          limit: 10,
        })
      );
    });

    it('returns 400 VALIDATION_ERROR on invalid parameters', async () => {
      const req = new NextRequest('http://localhost:3000/api/products?limit=-5');
      const res = await getProducts(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/products/[slug]', () => {
    it('returns 200 OK with product details and availability', async () => {
      const mockDetail = {
        id: 'prod-1',
        slug: 'blue-dream',
        name: 'Blue Dream 3.5g',
        priceMode: 'OWTLET',
        owtletPrice: '50.00',
        availability: [
          {
            dispensaryName: 'Gotham Greenery',
            price: '50.00',
            inStock: true,
            deliversToZip: true,
          },
        ],
      };
      (getProductBySlug as any).mockResolvedValue(mockDetail);

      const req = new NextRequest('http://localhost:3000/api/products/blue-dream?zip=10001');
      const res = await getProductDetail(req, { params: { slug: 'blue-dream' } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.name).toBe('Blue Dream 3.5g');
      expect(getProductBySlug).toHaveBeenCalledWith('blue-dream', { zip: '10001' });
    });

    it('returns 404 NOT_FOUND when product slug does not exist', async () => {
      (getProductBySlug as any).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/products/unknown-strain');
      const res = await getProductDetail(req, { params: { slug: 'unknown-strain' } });
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('NOT_FOUND');
    });

    it('returns 400 VALIDATION_ERROR on malformed ZIP code', async () => {
      const req = new NextRequest('http://localhost:3000/api/products/blue-dream?zip=abc');
      const res = await getProductDetail(req, { params: { slug: 'blue-dream' } });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/products/resolve', () => {
    it('resolves product by terrificProductId', async () => {
      const mockProduct = {
        id: 'prod-1',
        name: 'Blue Dream 3.5g',
        slug: 'blue-dream',
      };
      (resolveProduct as any).mockResolvedValue(mockProduct);

      const req = new NextRequest('http://localhost:3000/api/products/resolve?terrificProductId=terrific-123');
      const res = await getProductResolve(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.id).toBe('prod-1');
      expect(resolveProduct).toHaveBeenCalledWith({ terrificProductId: 'terrific-123' });
    });

    it('returns 404 UNMAPPED_PRODUCT when identifier is not found', async () => {
      (resolveProduct as any).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/products/resolve?sku=UNKNOWN-SKU');
      const res = await getProductResolve(req);
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('UNMAPPED_PRODUCT');
    });

    it('returns 400 VALIDATION_ERROR when no identifier query is passed', async () => {
      const req = new NextRequest('http://localhost:3000/api/products/resolve');
      const res = await getProductResolve(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });
});

