import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartStatus, ShowStatus, StrainType } from '@prisma/client';

vi.mock('@/server/db', () => ({
  prisma: {
    cart: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    cartItem: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
    brand: {
      findUnique: vi.fn(),
    },
    liveShow: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((fn: any) => {
      if (typeof fn === 'function') {
        return fn({
          cart: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
          },
          cartItem: {
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            deleteMany: vi.fn(),
            count: vi.fn(),
          },
        });
      }
      return Promise.all(fn);
    }),
  },
}));

vi.mock('@/server/products', () => ({
  resolveProduct: vi.fn(),
}));

import { prisma } from '@/server/db';
import { resolveProduct } from '@/server/products';
import {
  getOrCreateCart,
  getCartBySessionToken,
  syncCartItems,
  clearCart,
  UnmappedProductException,
  CartExpiredError,
} from '@/server/cart';

describe('Cart Service (AC-CART-01, AC-CART-02, AC-HOLD-01, docs/08 §4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProduct = {
    id: 'prod-uuid-1',
    slug: 'blue-dream-35g',
    name: 'Blue Dream 3.5g',
    imageUrls: ['https://cdn.owtlet.com/products/blue-dream.jpg'],
    owtletPrice: 45.0,
    isActive: true,
    category: { slug: 'flower', name: 'Flower' },
    strain: { name: 'Blue Dream', type: StrainType.HYBRID },
    brand: { slug: 'grand-national', name: 'Grand National' },
    inventory: [
      { dispensaryId: 'disp-1', price: 50.0, inStock: true },
    ],
  };

  describe('getOrCreateCart', () => {
    it('creates a new cart with 64-char cryptographic token if no session is provided', async () => {
      const now = new Date();
      (prisma.cart.create as any).mockResolvedValue({
        id: 'cart-1',
        sessionToken: 'token-abc',
        status: CartStatus.ACTIVE,
        lastActivityAt: now,
        expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
        liveShowId: null,
        items: [],
        liveShow: null,
      });

      const result = await getOrCreateCart(null);

      expect(result.isNew).toBe(true);
      expect(result.sessionToken).toBeTruthy();
      expect(result.cart.items).toHaveLength(0);
      expect(result.cart.itemCount).toBe(0);
      expect(result.cart.estimatedSubtotal).toBe('0.00');
    });

    it('returns existing cart if active and not expired', async () => {
      const now = new Date();
      const existingCart = {
        id: 'cart-1',
        sessionToken: 'existing-token',
        status: CartStatus.ACTIVE,
        lastActivityAt: now,
        expiresAt: new Date(now.getTime() + 20 * 60 * 1000),
        liveShowId: null,
        items: [],
        liveShow: null,
      };

      (prisma.cart.findUnique as any).mockResolvedValue(existingCart);

      const result = await getOrCreateCart('existing-token');

      expect(result.isNew).toBe(false);
      expect(result.sessionToken).toBe('existing-token');
      expect(result.cart.id).toBe('cart-1');
    });

    it('marks expired and issues a new cart when existing cart has passed expiresAt', async () => {
      const past = new Date(Date.now() - 10000);
      const expiredCart = {
        id: 'cart-expired',
        sessionToken: 'expired-token',
        status: CartStatus.ACTIVE,
        lastActivityAt: new Date(past.getTime() - 30 * 60 * 1000),
        expiresAt: past,
        liveShowId: null,
        items: [],
        liveShow: null,
      };

      (prisma.cart.findUnique as any).mockResolvedValue(expiredCart);
      (prisma.cart.update as any).mockResolvedValue({ ...expiredCart, status: CartStatus.EXPIRED });
      (prisma.cart.create as any).mockResolvedValue({
        id: 'cart-new',
        sessionToken: 'new-token-123',
        status: CartStatus.ACTIVE,
        lastActivityAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        liveShowId: null,
        items: [],
        liveShow: null,
      });

      const result = await getOrCreateCart('expired-token');

      expect(result.isNew).toBe(true);
      expect(result.wasExpired).toBe(true);
      expect(prisma.cart.update).toHaveBeenCalledWith({
        where: { id: 'cart-expired' },
        data: { status: CartStatus.EXPIRED },
      });
    });
  });

  describe('syncCartItems - Unmapped Product Rejection (docs/08 §4.2)', () => {
    it('throws UnmappedProductException with 404 details when product cannot be resolved', async () => {
      (resolveProduct as any).mockResolvedValue(null);

      await expect(
        syncCartItems('token-1', {
          action: 'addProductToCart',
          cartProducts: [
            {
              externalId: 'terrific-unknown-999',
              quantity: 1,
            },
          ],
        })
      ).rejects.toThrow(UnmappedProductException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('syncCartItems - Adding, Updating & Removing Items', () => {
    it('adds item to cart and formats standardized CartDetailDto', async () => {
      (resolveProduct as any).mockResolvedValue(mockProduct);

      const now = new Date();
      const mockTx = {
        cart: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'cart-1',
            sessionToken: 'token-1',
            status: CartStatus.ACTIVE,
            lastActivityAt: now,
            expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
            liveShowId: null,
            items: [],
            liveShow: null,
          }),
          update: vi.fn().mockImplementation(({ data }) => ({
            id: 'cart-1',
            sessionToken: 'token-1',
            status: CartStatus.ACTIVE,
            lastActivityAt: now,
            expiresAt: data.expiresAt,
            liveShowId: data.liveShowId,
            items: [
              {
                id: 'item-1',
                productId: mockProduct.id,
                quantity: 2,
                source: 'catalog',
                channelBrandId: null,
                preferredDispensaryId: null,
                product: mockProduct,
                channelBrand: null,
              },
            ],
            liveShow: null,
          })),
        },
        cartItem: {
          findFirst: vi.fn().mockResolvedValue(null),
          count: vi.fn().mockResolvedValue(0),
          create: vi.fn().mockResolvedValue({ id: 'item-1' }),
        },
      };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      const result = await syncCartItems('token-1', {
        action: 'addProductToCart',
        source: 'catalog',
        cartProducts: [
          {
            productId: mockProduct.id,
            quantity: 2,
          },
        ],
      });

      expect(mockTx.cartItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cartId: 'cart-1',
          productId: mockProduct.id,
          quantity: 2,
          channelBrandId: null,
        }),
      });

      expect(result.itemCount).toBe(2);
      expect(result.estimatedSubtotal).toBe('90.00'); // 45.00 * 2
      expect(result.items[0].priceMode).toBe('OWTLET');
    });

    it('performs NULL-safe upsert when updating quantity on an existing line with channelBrandId: null', async () => {
      (resolveProduct as any).mockResolvedValue(mockProduct);

      const now = new Date();
      const existingItem = {
        id: 'item-existing',
        productId: mockProduct.id,
        quantity: 1,
        source: 'catalog',
        channelBrandId: null,
      };

      const mockTx = {
        cart: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'cart-1',
            sessionToken: 'token-1',
            status: CartStatus.ACTIVE,
            lastActivityAt: now,
            expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
            liveShowId: null,
            items: [existingItem],
            liveShow: null,
          }),
          update: vi.fn().mockReturnValue({
            id: 'cart-1',
            sessionToken: 'token-1',
            status: CartStatus.ACTIVE,
            lastActivityAt: now,
            expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
            liveShowId: null,
            items: [
              {
                ...existingItem,
                quantity: 3,
                product: mockProduct,
                channelBrand: null,
              },
            ],
            liveShow: null,
          }),
        },
        cartItem: {
          findFirst: vi.fn().mockResolvedValue(existingItem),
          update: vi.fn().mockResolvedValue({ id: 'item-existing', quantity: 3 }),
        },
      };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await syncCartItems('token-1', {
        action: 'addProductToCart',
        cartProducts: [
          {
            productId: mockProduct.id,
            quantity: 2,
          },
        ],
      });

      expect(mockTx.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'item-existing' },
        data: expect.objectContaining({
          quantity: 3, // 1 + 2
        }),
      });
    });

    it('removes item when quantity is updated to 0', async () => {
      (resolveProduct as any).mockResolvedValue(mockProduct);

      const existingItem = {
        id: 'item-to-remove',
        productId: mockProduct.id,
        quantity: 2,
        channelBrandId: null,
      };

      const mockTx = {
        cart: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'cart-1',
            sessionToken: 'token-1',
            status: CartStatus.ACTIVE,
            lastActivityAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
            liveShowId: null,
            items: [existingItem],
            liveShow: null,
          }),
          update: vi.fn().mockReturnValue({
            id: 'cart-1',
            sessionToken: 'token-1',
            status: CartStatus.ACTIVE,
            lastActivityAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
            liveShowId: null,
            items: [],
            liveShow: null,
          }),
        },
        cartItem: {
          findFirst: vi.fn().mockResolvedValue(existingItem),
          delete: vi.fn().mockResolvedValue({}),
        },
      };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      const result = await syncCartItems('token-1', {
        action: 'updateProductInCart',
        cartProducts: [
          {
            productId: mockProduct.id,
            quantity: 0,
          },
        ],
      });

      expect(mockTx.cartItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-to-remove' },
      });
      expect(result.itemCount).toBe(0);
    });
  });

  describe('clearCart', () => {
    it('deletes all items and resets cart hold', async () => {
      const now = new Date();
      const mockTx = {
        cart: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'cart-1',
            sessionToken: 'token-1',
            status: CartStatus.ACTIVE,
          }),
          update: vi.fn().mockResolvedValue({
            id: 'cart-1',
            sessionToken: 'token-1',
            status: CartStatus.ACTIVE,
            lastActivityAt: now,
            expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
            liveShowId: null,
            items: [],
            liveShow: null,
          }),
        },
        cartItem: {
          deleteMany: vi.fn().mockResolvedValue({ count: 3 }),
        },
      };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      const result = await clearCart('token-1');

      expect(mockTx.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart-1' },
      });
      expect(result.itemCount).toBe(0);
      expect(result.estimatedSubtotal).toBe('0.00');
    });
  });
});
