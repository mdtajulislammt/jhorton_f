/**
 * Terrific Live Shopping SDK v2 Client Bridge
 * Enforces technical contracts in docs/05 §4, docs/02 §3.1-3.2, docs/08 §4.2, and ADR-006.
 *
 * All pinned products in Owtlet live shows, replays, and shoppable videos are cannabis-only.
 * Synchronizes Terrific in-stream actions directly with Owtlet's custom cart (/api/cart/items).
 */

import { apiClient, ApiError } from '@/lib/api-client';
import { useCartStore } from '@/stores/cart.store';
import { toast } from '@/stores/toast.store';
import { CartDetailDto, CartSyncPayload, CartProductInput } from '@/types/api.generated';

export type TerrificAction = 'addProductToCart' | 'updateProductInCart' | 'removeProductFromCart';

export type TerrificSource = 'terrific_live' | 'terrific_replay' | 'terrific_video';

export interface TerrificProductRaw {
  id?: string | number;
  externalId?: string;
  productId?: string;
  sku?: string;
  quantity?: number;
  name?: string;
  title?: string;
  price?: string | number;
  [key: string]: any;
}

export interface TerrificCartSyncPayload {
  action: TerrificAction;
  cartProducts: TerrificProductRaw[];
}

export interface TerrificGoToCheckoutPayload {
  cartProducts?: TerrificProductRaw[];
  coupons?: any[];
  redirectUrl?: string;
  [key: string]: any;
}

export interface TerrificLiveSettings {
  cartSyncConfig: {
    cartSyncHandler: (payload: TerrificCartSyncPayload) => Promise<boolean | void>;
  };
  goToCheckoutConfig: {
    goToCheckoutHandler: (payload: TerrificGoToCheckoutPayload) => Promise<boolean | void>;
  };
  [key: string]: any;
}

export interface TerrificLiveInstance {
  on?: (event: string, callback: (...args: any[]) => void) => void;
  off?: (event: string, callback: (...args: any[]) => void) => void;
  addEventListener?: (event: string, callback: (...args: any[]) => void) => void;
  removeEventListener?: (event: string, callback: (...args: any[]) => void) => void;
  emit?: (event: string, ...args: any[]) => void;
  [key: string]: any;
}

declare global {
  interface Window {
    terrificLiveSettings?: TerrificLiveSettings;
    terrificLive?: TerrificLiveInstance;
  }
}

export interface BridgeSyncOptions {
  source?: TerrificSource;
  liveShowId?: string;
  channelBrandSlug?: string;
  showToast?: boolean;
}

export class TerrificBridge {
  private activeLiveShowId?: string;
  private activeSource: TerrificSource = 'terrific_live';
  private activeChannelBrandSlug?: string;

  /**
   * Set active context for current show or shoppable video
   */
  public setContext(options: {
    liveShowId?: string;
    source?: TerrificSource;
    channelBrandSlug?: string;
  }) {
    if (options.liveShowId !== undefined) this.activeLiveShowId = options.liveShowId;
    if (options.source !== undefined) this.activeSource = options.source;
    if (options.channelBrandSlug !== undefined) this.activeChannelBrandSlug = options.channelBrandSlug;
  }

  /**
   * Normalizes raw Terrific cart product input into Owtlet cart product parameters
   */
  public normalizeProductInput(raw: TerrificProductRaw): CartProductInput {
    const externalId =
      raw.externalId ||
      (raw.id !== undefined && raw.id !== null ? String(raw.id).trim() : undefined);

    const quantity =
      typeof raw.quantity === 'number' && !isNaN(raw.quantity)
        ? Math.max(0, Math.min(10, Math.floor(raw.quantity)))
        : 1;

    return {
      externalId: externalId || undefined,
      productId: raw.productId || undefined,
      sku: raw.sku ? String(raw.sku).trim() : undefined,
      quantity,
      preferredDispensaryId: raw.preferredDispensaryId,
    };
  }

  /**
   * Core sync method called by Terrific cartSyncHandler
   * Maps action and product items into /api/cart/items
   */
  public async sync(
    action: TerrificAction,
    cartProducts: TerrificProductRaw[],
    options?: BridgeSyncOptions
  ): Promise<CartDetailDto | null> {
    if (!cartProducts || cartProducts.length === 0) {
      console.warn('[TerrificBridge] sync called with empty cartProducts array');
      return null;
    }

    const source = options?.source || this.activeSource || 'terrific_live';
    const liveShowId = options?.liveShowId || this.activeLiveShowId;
    const channelBrandSlug = options?.channelBrandSlug || this.activeChannelBrandSlug;
    const shouldShowToast = options?.showToast ?? true;

    const normalizedProducts: CartProductInput[] = cartProducts.map((p) =>
      this.normalizeProductInput(p)
    );

    const payload: CartSyncPayload = {
      action,
      source,
      liveShowId,
      channelBrandSlug,
      cartProducts: normalizedProducts,
    };

    try {
      let res;
      if (action === 'addProductToCart') {
        res = await apiClient.post<CartDetailDto>('/cart/items', payload);
      } else if (action === 'updateProductInCart') {
        res = await apiClient.patch<CartDetailDto>('/cart/items', payload);
      } else if (action === 'removeProductFromCart') {
        res = await apiClient.delete<CartDetailDto>('/cart/items', {
          body: JSON.stringify(payload),
        });
      } else {
        throw new Error(`Unsupported Terrific sync action: ${action}`);
      }

      const updatedCart = res.data;

      // Update Zustand cart store
      useCartStore.getState().setCart(updatedCart);

      if (shouldShowToast && action === 'addProductToCart') {
        const firstProdName = cartProducts[0]?.name || cartProducts[0]?.title || 'Cannabis product';
        toast.success(`${firstProdName} added to your cart.`);
      }

      return updatedCart;
    } catch (error: any) {
      const apiErr = error as ApiError;

      // Handle unmapped product (AC-LIVE-03, T-MAP-01)
      if (
        apiErr.statusCode === 404 ||
        apiErr.message?.includes('UNMAPPED_PRODUCT') ||
        (apiErr.errors && Array.isArray(apiErr.errors) && apiErr.errors.some((e: any) => e.code === 'UNMAPPED_PRODUCT'))
      ) {
        console.error('[TerrificBridge] Unmapped live product error:', apiErr);
        if (shouldShowToast) {
          toast.error("This product isn't available on Owtlet yet.");
        }
        return null;
      }

      // Handle expired cart hold
      if (apiErr.statusCode === 410) {
        useCartStore.getState().setExpired(true);
        if (shouldShowToast) {
          toast.error('Your cannabis cart hold has expired. A fresh cart has been issued.');
        }
        return null;
      }

      // Other errors
      console.error('[TerrificBridge] Cart sync error:', apiErr);
      if (shouldShowToast) {
        toast.error(apiErr.message || 'Failed to update cannabis cart.');
      }
      return null;
    }
  }

  /**
   * Reconciles cart products from the Terrific player before jumping to checkout
   */
  public async reconcile(
    cartProducts?: TerrificProductRaw[],
    options?: BridgeSyncOptions
  ): Promise<CartDetailDto | null> {
    if (!cartProducts || cartProducts.length === 0) {
      // Return currently loaded cart if already present
      return useCartStore.getState().cart;
    }

    return this.sync('updateProductInCart', cartProducts, {
      ...options,
      showToast: false,
    });
  }

  /**
   * Handler for Terrific GoToCheckout event and goToCheckoutHandler hook
   * Reconciles cart and routes to /checkout
   */
  public async goToCheckout(
    payload: TerrificGoToCheckoutPayload,
    router?: { push: (url: string) => void },
    options?: BridgeSyncOptions
  ): Promise<boolean> {
    try {
      if (payload?.cartProducts && payload.cartProducts.length > 0) {
        await this.reconcile(payload.cartProducts, options);
      }

      const targetUrl = '/checkout';

      if (router && typeof router.push === 'function') {
        router.push(targetUrl);
      } else if (typeof window !== 'undefined') {
        window.location.href = targetUrl;
      }

      return true;
    } catch (err) {
      console.error('[TerrificBridge] Error in goToCheckout:', err);
      // Fallback navigation
      if (typeof window !== 'undefined') {
        window.location.href = '/checkout';
      }
      return true;
    }
  }

  /**
   * Creates the TerrificLiveSettings configuration object required before SDK script loads
   */
  public createSettings(router?: { push: (url: string) => void }): TerrificLiveSettings {
    return {
      cartSyncConfig: {
        cartSyncHandler: async (payload: TerrificCartSyncPayload) => {
          await this.sync(payload.action, payload.cartProducts);
          return true;
        },
      },
      goToCheckoutConfig: {
        goToCheckoutHandler: async (payload: TerrificGoToCheckoutPayload) => {
          return await this.goToCheckout(payload, router);
        },
      },
    };
  }

  /**
   * Attaches bridge settings to window.terrificLiveSettings
   */
  public initializeSettings(router?: { push: (url: string) => void }): void {
    if (typeof window === 'undefined') return;
    window.terrificLiveSettings = this.createSettings(router);
  }
}

export const terrificBridge = new TerrificBridge();

