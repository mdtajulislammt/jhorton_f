'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  terrificBridge,
  TerrificAction,
  TerrificProductRaw,
  TerrificSource,
  TerrificCartSyncPayload,
  TerrificGoToCheckoutPayload,
} from '@/lib/terrific';
import { useCart } from '@/hooks/useCart';

export interface UseTerrificBridgeOptions {
  liveShowId?: string;
  source?: TerrificSource;
  channelBrandSlug?: string;
  autoInitialize?: boolean;
}

export function useTerrificBridge(options: UseTerrificBridgeOptions = {}) {
  const router = useRouter();
  const { refetch: refetchCart } = useCart();
  const [isReady, setIsReady] = React.useState(false);

  const {
    liveShowId,
    source = 'terrific_live',
    channelBrandSlug,
    autoInitialize = true,
  } = options;

  // Update bridge context whenever props change
  React.useEffect(() => {
    terrificBridge.setContext({
      liveShowId,
      source,
      channelBrandSlug,
    });
  }, [liveShowId, source, channelBrandSlug]);

  // Set window.terrificLiveSettings before SDK loads
  React.useEffect(() => {
    if (!autoInitialize || typeof window === 'undefined') return;

    terrificBridge.initializeSettings(router);
  }, [autoInitialize, router]);

  // Subscribe to SDK events once window.terrificLive becomes available
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    let checkInterval: NodeJS.Timeout | null = null;
    let cleanupFns: Array<() => void> = [];

    const setupListeners = (sdk: any) => {
      setIsReady(true);

      const handleCartChange = (data?: any) => {
        refetchCart();
      };

      const handleGoToCheckout = (data?: any) => {
        terrificBridge.goToCheckout(data || {}, router);
      };

      const handleNavigate = (data?: any) => {
        if (data?.url) {
          router.push(data.url);
        }
      };

      if (typeof sdk.on === 'function') {
        sdk.on('cart-change-notification', handleCartChange);
        sdk.on('GoToCheckout', handleGoToCheckout);
        sdk.on('Navigate', handleNavigate);

        cleanupFns.push(() => {
          if (typeof sdk.off === 'function') {
            sdk.off('cart-change-notification', handleCartChange);
            sdk.off('GoToCheckout', handleGoToCheckout);
            sdk.off('Navigate', handleNavigate);
          }
        });
      } else if (typeof sdk.addEventListener === 'function') {
        sdk.addEventListener('cart-change-notification', handleCartChange);
        sdk.addEventListener('GoToCheckout', handleGoToCheckout);
        sdk.addEventListener('Navigate', handleNavigate);

        cleanupFns.push(() => {
          if (typeof sdk.removeEventListener === 'function') {
            sdk.removeEventListener('cart-change-notification', handleCartChange);
            sdk.removeEventListener('GoToCheckout', handleGoToCheckout);
            sdk.removeEventListener('Navigate', handleNavigate);
          }
        });
      }
    };

    if (window.terrificLive) {
      setupListeners(window.terrificLive);
    } else {
      // Poll briefly for Terrific SDK script initialization
      let attempts = 0;
      checkInterval = setInterval(() => {
        attempts++;
        if (window.terrificLive) {
          if (checkInterval) clearInterval(checkInterval);
          setupListeners(window.terrificLive);
        } else if (attempts > 30) {
          if (checkInterval) clearInterval(checkInterval);
        }
      }, 500);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      cleanupFns.forEach((fn) => fn());
    };
  }, [refetchCart, router]);

  const sync = React.useCallback(
    async (action: TerrificAction, cartProducts: TerrificProductRaw[]) => {
      return terrificBridge.sync(action, cartProducts, {
        liveShowId,
        source,
        channelBrandSlug,
      });
    },
    [liveShowId, source, channelBrandSlug]
  );

  const reconcile = React.useCallback(
    async (cartProducts?: TerrificProductRaw[]) => {
      return terrificBridge.reconcile(cartProducts, {
        liveShowId,
        source,
        channelBrandSlug,
      });
    },
    [liveShowId, source, channelBrandSlug]
  );

  const goToCheckout = React.useCallback(
    async (payload: TerrificGoToCheckoutPayload) => {
      return terrificBridge.goToCheckout(payload, router, {
        liveShowId,
        source,
        channelBrandSlug,
      });
    },
    [router, liveShowId, source, channelBrandSlug]
  );

  return {
    isReady,
    sync,
    reconcile,
    goToCheckout,
    bridge: terrificBridge,
  };
}

