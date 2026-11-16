import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { terrificBridge, TerrificBridge } from '@/lib/terrific';
import { apiClient } from '@/lib/api-client';
import { useCartStore } from '@/stores/cart.store';
import { toast } from '@/stores/toast.store';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/stores/toast.store', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('Terrific Live Bridge (docs/05 §4, ADR-006, AC-LIVE-01..04, T-TRF-01, T-MAP-01)', () => {
  let bridge: TerrificBridge;

  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).window = {
      location: { href: '' },
    };
    bridge = new TerrificBridge();
    useCartStore.getState().setCart(null);
  });

  afterEach(() => {
    delete (globalThis as any).window;
  });

  describe('normalizeProductInput', () => {
    it('normalizes externalId, sku, quantity, and preferred dispensary', () => {
      const input = {
        id: 'terrific-item-99',
        sku: 'HVB-PR-SD-5PK',
        quantity: 2,
        name: 'Sour Diesel Pre-Roll',
        preferredDispensaryId: 'disp-uuid-1',
      };

      const normalized = bridge.normalizeProductInput(input);
      expect(normalized).toEqual({
        externalId: 'terrific-item-99',
        productId: undefined,
        sku: 'HVB-PR-SD-5PK',
        quantity: 2,
        preferredDispensaryId: 'disp-uuid-1',
      });
    });

    it('clamps quantity to [0, 10] and defaults invalid quantity to 1', () => {
      expect(bridge.normalizeProductInput({ id: 123, quantity: 99 }).quantity).toBe(10);
      expect(bridge.normalizeProductInput({ id: 123, quantity: -5 }).quantity).toBe(0);
      expect(bridge.normalizeProductInput({ id: 123, quantity: NaN }).quantity).toBe(1);
    });
  });

  describe('sync (T-TRF-01: addProductToCart, updateProductInCart, removeProductFromCart)', () => {
    const mockCartResponse = {
      id: 'cart-uuid-1',
      status: 'ACTIVE',
      itemCount: 1,
      estimatedSubtotal: '38.00',
      lines: [
        {
          id: 'line-1',
          productId: 'prod-uuid-1',
          name: 'Sour Diesel Pre-Roll',
          quantity: 1,
          priceMode: 'OWTLET',
          unitPrice: '38.00',
        },
      ],
    };

    it('calls POST /api/cart/items for addProductToCart and shows success toast (AC-LIVE-02, T-TRF-01)', async () => {
      (apiClient.post as any).mockResolvedValueOnce({
        success: true,
        data: mockCartResponse,
      });

      const result = await bridge.sync(
        'addProductToCart',
        [{ externalId: 'terrific-prod-sour-diesel-prerolls', name: 'Sour Diesel Pre-Roll', quantity: 1 }],
        {
          liveShowId: 'show-launch-drop-001',
          source: 'terrific_live',
        }
      );

      expect(apiClient.post).toHaveBeenCalledWith('/cart/items', {
        action: 'addProductToCart',
        source: 'terrific_live',
        liveShowId: 'show-launch-drop-001',
        channelBrandSlug: undefined,
        cartProducts: [
          {
            externalId: 'terrific-prod-sour-diesel-prerolls',
            productId: undefined,
            sku: undefined,
            quantity: 1,
            preferredDispensaryId: undefined,
          },
        ],
      });

      expect(result).toEqual(mockCartResponse);
      expect(useCartStore.getState().cart).toEqual(mockCartResponse);
      expect(toast.success).toHaveBeenCalledWith('Sour Diesel Pre-Roll added to your cart.');
    });

    it('calls PATCH /api/cart/items for updateProductInCart', async () => {
      (apiClient.patch as any).mockResolvedValueOnce({
        success: true,
        data: { ...mockCartResponse, itemCount: 2 },
      });

      const result = await bridge.sync('updateProductInCart', [
        { externalId: 'terrific-prod-sour-diesel-prerolls', quantity: 2 },
      ]);

      expect(apiClient.patch).toHaveBeenCalledWith(
        '/cart/items',
        expect.objectContaining({
          action: 'updateProductInCart',
          cartProducts: [
            expect.objectContaining({
              externalId: 'terrific-prod-sour-diesel-prerolls',
              quantity: 2,
            }),
          ],
        })
      );
      expect(result?.itemCount).toBe(2);
    });

    it('calls DELETE /api/cart/items for removeProductFromCart', async () => {
      (apiClient.delete as any).mockResolvedValueOnce({
        success: true,
        data: { ...mockCartResponse, itemCount: 0, lines: [] },
      });

      const result = await bridge.sync('removeProductFromCart', [
        { externalId: 'terrific-prod-sour-diesel-prerolls', quantity: 0 },
      ]);

      expect(apiClient.delete).toHaveBeenCalledWith(
        '/cart/items',
        expect.objectContaining({
          body: expect.stringContaining('"action":"removeProductFromCart"'),
        })
      );
      expect(result?.itemCount).toBe(0);
    });

    it('handles unmapped products gracefully with 404 UNMAPPED_PRODUCT toast (AC-LIVE-03, T-MAP-01)', async () => {
      const unmappedError = {
        statusCode: 404,
        message: 'Product could not be mapped to Owtlet catalog',
        errors: [{ code: 'UNMAPPED_PRODUCT', externalId: 'unmapped-id-999' }],
      };
      (apiClient.post as any).mockRejectedValueOnce(unmappedError);

      const result = await bridge.sync('addProductToCart', [
        { externalId: 'unmapped-id-999', quantity: 1 },
      ]);

      expect(result).toBeNull();
      // AC-LIVE-03 verbatim: "This product isn't available on Owtlet yet."
      expect(toast.error).toHaveBeenCalledWith("This product isn't available on Owtlet yet.");
    });

    it('handles shoppable video and replay sources correctly (AC-LIVE-04)', async () => {
      (apiClient.post as any).mockResolvedValueOnce({
        success: true,
        data: mockCartResponse,
      });

      await bridge.sync(
        'addProductToCart',
        [{ externalId: 'terrific-prod-video', quantity: 1 }],
        { source: 'terrific_video' }
      );

      expect(apiClient.post).toHaveBeenCalledWith(
        '/cart/items',
        expect.objectContaining({
          source: 'terrific_video',
        })
      );
    });
  });

  describe('goToCheckout', () => {
    it('reconciles cart and routes to /checkout, returning true (T-TRF-01)', async () => {
      const mockRouter = { push: vi.fn() };
      (apiClient.patch as any).mockResolvedValueOnce({
        success: true,
        data: { id: 'cart-1' },
      });

      const resolved = await bridge.goToCheckout(
        {
          cartProducts: [{ externalId: 'terrific-prod-1', quantity: 1 }],
        },
        mockRouter
      );

      expect(resolved).toBe(true);
      expect(apiClient.patch).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith('/checkout');
    });
  });

  describe('initializeSettings (window.terrificLiveSettings)', () => {
    it('initializes window.terrificLiveSettings with expected handlers before SDK loads', () => {
      bridge.initializeSettings();

      const win = (globalThis as any).window;
      expect(win.terrificLiveSettings).toBeDefined();
      expect(typeof win.terrificLiveSettings?.cartSyncConfig?.cartSyncHandler).toBe('function');
      expect(typeof win.terrificLiveSettings?.goToCheckoutConfig?.goToCheckoutHandler).toBe('function');
    });
  });
});
