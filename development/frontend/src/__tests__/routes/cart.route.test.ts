import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/server/cart', () => ({
  getOrCreateCart: vi.fn(),
  getCartBySessionToken: vi.fn(),
  syncCartItems: vi.fn(),
  clearCart: vi.fn(),
  UnmappedProductException: class UnmappedProductException extends Error {
    public details: any[];
    constructor(details: any[]) {
      super('Unmapped');
      this.name = 'UnmappedProductException';
      this.details = details;
    }
  },
  CartExpiredError: class CartExpiredError extends Error {
    constructor() {
      super('Cart expired');
      this.name = 'CartExpiredError';
    }
  },
}));

import {
  getOrCreateCart,
  getCartBySessionToken,
  syncCartItems,
  clearCart,
  UnmappedProductException,
  CartExpiredError,
} from '@/server/cart';

import { GET as getCartHandler, DELETE as clearCartHandler } from '@/app/api/cart/route';
import {
  POST as addItemsHandler,
  PATCH as updateItemsHandler,
  DELETE as removeItemsHandler,
} from '@/app/api/cart/items/route';

describe('Cart Route Handlers (docs/08 §4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCartDto = {
    id: 'cart-1',
    sessionToken: 'token-1',
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    lastActivityAt: new Date().toISOString(),
    hold: {
      reason: 'INACTIVITY',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    },
    items: [],
    itemCount: 0,
    estimatedSubtotal: '0.00',
  };

  describe('GET /api/cart', () => {
    it('returns 200 with cart when active session cookie is provided', async () => {
      (getCartBySessionToken as any).mockResolvedValue({
        cart: mockCartDto,
        isExpired: false,
      });

      const req = new NextRequest('http://localhost:3000/api/cart', {
        headers: {
          cookie: 'owt_cart=token-1',
        },
      });

      const res = await getCartHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.id).toBe('cart-1');
    });

    it('returns 410 CART_EXPIRED and issues new cookie when cart hold has lapsed', async () => {
      (getCartBySessionToken as any).mockResolvedValue({
        cart: null,
        isExpired: true,
      });

      (getOrCreateCart as any).mockResolvedValue({
        cart: { ...mockCartDto, id: 'new-cart' },
        sessionToken: 'new-token-999',
        isNew: true,
      });

      const req = new NextRequest('http://localhost:3000/api/cart', {
        headers: {
          cookie: 'owt_cart=expired-token',
        },
      });

      const res = await getCartHandler(req);
      const json = await res.json();

      expect(res.status).toBe(410);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('CART_EXPIRED');
      expect(res.cookies.get('owt_cart')?.value).toBe('new-token-999');
    });

    it('creates new cart and sets owt_cart cookie when no cookie exists', async () => {
      (getOrCreateCart as any).mockResolvedValue({
        cart: mockCartDto,
        sessionToken: 'generated-token',
        isNew: true,
      });

      const req = new NextRequest('http://localhost:3000/api/cart');
      const res = await getCartHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(res.cookies.get('owt_cart')?.value).toBe('generated-token');
    });
  });

  describe('POST /api/cart/items (Add to cart)', () => {
    it('returns 200 with updated cart on valid payload', async () => {
      const updatedDto = {
        ...mockCartDto,
        itemCount: 1,
        estimatedSubtotal: '45.00',
        items: [{ id: 'line-1', productId: 'e925b035-7729-43c9-83bc-6644fcf64551', quantity: 1 }],
      };
      (syncCartItems as any).mockResolvedValue(updatedDto);

      const req = new NextRequest('http://localhost:3000/api/cart/items', {
        method: 'POST',
        headers: {
          cookie: 'owt_cart=token-1',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addProductToCart',
          source: 'catalog',
          cartProducts: [
            {
              productId: 'e925b035-7729-43c9-83bc-6644fcf64551',
              quantity: 1,
            },
          ],
        }),
      });

      const res = await addItemsHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.itemCount).toBe(1);
    });

    it('accepts brand storefront items with channelBrandSlug and brand_storefront source (REQ-F-011, TASK-020)', async () => {
      const updatedDto = {
        ...mockCartDto,
        itemCount: 1,
        items: [
          {
            id: 'line-brand-1',
            productId: 'e925b035-7729-43c9-83bc-6644fcf64551',
            quantity: 1,
            source: 'brand_storefront',
            channelBrand: {
              id: 'brand-1',
              name: 'Hudson Cannabis',
              slug: 'hudson-cannabis',
            },
          },
        ],
      };
      (syncCartItems as any).mockResolvedValue(updatedDto);

      const req = new NextRequest('http://localhost:3000/api/cart/items', {
        method: 'POST',
        headers: {
          cookie: 'owt_cart=token-1',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addProductToCart',
          source: 'brand_storefront',
          channelBrandSlug: 'hudson-cannabis',
          cartProducts: [
            {
              productId: 'e925b035-7729-43c9-83bc-6644fcf64551',
              quantity: 1,
            },
          ],
        }),
      });

      const res = await addItemsHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.items[0].source).toBe('brand_storefront');
      expect(json.data.items[0].channelBrand?.slug).toBe('hudson-cannabis');
    });

    it('returns 404 UNMAPPED_PRODUCT when an unknown product id is submitted', async () => {
      (syncCartItems as any).mockRejectedValue(
        new UnmappedProductException([
          { externalId: 'unknown-999', reason: 'Unmapped cannabis product' },
        ])
      );

      const req = new NextRequest('http://localhost:3000/api/cart/items', {
        method: 'POST',
        headers: {
          cookie: 'owt_cart=token-1',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addProductToCart',
          source: 'terrific_live',
          cartProducts: [
            {
              externalId: 'unknown-999',
              quantity: 1,
            },
          ],
        }),
      });

      const res = await addItemsHandler(req);
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('UNMAPPED_PRODUCT');
    });

    it('returns 400 VALIDATION_ERROR on empty or invalid cartProducts', async () => {
      const req = new NextRequest('http://localhost:3000/api/cart/items', {
        method: 'POST',
        headers: {
          cookie: 'owt_cart=token-1',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addProductToCart',
          cartProducts: [], // empty array violates min(1)
        }),
      });

      const res = await addItemsHandler(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PATCH /api/cart/items (Update quantity)', () => {
    it('returns 200 with updated cart on quantity change', async () => {
      (syncCartItems as any).mockResolvedValue({
        ...mockCartDto,
        itemCount: 3,
      });

      const req = new NextRequest('http://localhost:3000/api/cart/items', {
        method: 'PATCH',
        headers: {
          cookie: 'owt_cart=token-1',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateProductInCart',
          cartProducts: [
            {
              productId: 'e925b035-7729-43c9-83bc-6644fcf64551',
              quantity: 3,
            },
          ],
        }),
      });

      const res = await updateItemsHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.itemCount).toBe(3);
    });
  });

  describe('DELETE /api/cart/items (Remove item)', () => {
    it('returns 200 on item removal', async () => {
      (syncCartItems as any).mockResolvedValue(mockCartDto);

      const req = new NextRequest('http://localhost:3000/api/cart/items', {
        method: 'DELETE',
        headers: {
          cookie: 'owt_cart=token-1',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'removeProductFromCart',
          cartProducts: [
            {
              productId: 'e925b035-7729-43c9-83bc-6644fcf64551',
              quantity: 0,
            },
          ],
        }),
      });

      const res = await removeItemsHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  describe('DELETE /api/cart (Clear cart)', () => {
    it('returns 200 with cleared empty cart', async () => {
      (clearCart as any).mockResolvedValue(mockCartDto);

      const req = new NextRequest('http://localhost:3000/api/cart', {
        method: 'DELETE',
        headers: {
          cookie: 'owt_cart=token-1',
        },
      });

      const res = await clearCartHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.itemCount).toBe(0);
    });
  });
});
