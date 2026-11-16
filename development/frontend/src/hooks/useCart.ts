'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCartStore } from '@/stores/cart.store';
import { apiClient } from '@/lib/api-client';
import { CartDetailDto, CartSyncPayload } from '@/server/cart/types';

export const CART_QUERY_KEY = ['cart'] as const;

export function useCart() {
  const queryClient = useQueryClient();
  const {
    isOpen,
    isExpired,
    openCart,
    closeCart,
    toggleCart,
    setCart,
    setExpired,
  } = useCartStore();

  const query = useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: async () => {
      try {
        const response = await apiClient.get<CartDetailDto>('/cart');
        const cartData = response.data;
        setCart(cartData);
        setExpired(false);
        return cartData;
      } catch (err: any) {
        if (err.statusCode === 410) {
          setExpired(true);
        }
        throw err;
      }
    },
    staleTime: 1000 * 15, // 15 seconds
  });

  const cart = query.data ?? useCartStore.getState().cart;

  const addMutation = useMutation({
    mutationFn: async (params: {
      productId?: string;
      externalId?: string;
      sku?: string;
      quantity?: number;
      source?: string;
      liveShowId?: string;
      channelBrandSlug?: string;
      preferredDispensaryId?: string;
    }) => {
      const payload: CartSyncPayload = {
        action: 'addProductToCart',
        source: (params.source as any) || 'catalog',
        liveShowId: params.liveShowId,
        channelBrandSlug: params.channelBrandSlug,
        cartProducts: [
          {
            productId: params.productId,
            externalId: params.externalId,
            sku: params.sku,
            quantity: params.quantity ?? 1,
            preferredDispensaryId: params.preferredDispensaryId,
          },
        ],
      };

      const response = await apiClient.post<CartDetailDto>('/cart/items', payload);
      return response.data;
    },
    onSuccess: (updatedCart) => {
      setCart(updatedCart);
      queryClient.setQueryData(CART_QUERY_KEY, updatedCart);
      openCart();
    },
    onError: (err: any) => {
      if (err.statusCode === 410) {
        setExpired(true);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (params: {
      productId: string;
      quantity: number;
      preferredDispensaryId?: string;
    }) => {
      const payload: CartSyncPayload = {
        action: 'updateProductInCart',
        cartProducts: [
          {
            productId: params.productId,
            quantity: params.quantity,
            preferredDispensaryId: params.preferredDispensaryId,
          },
        ],
      };

      const response = await apiClient.patch<CartDetailDto>('/cart/items', payload);
      return response.data;
    },
    onSuccess: (updatedCart) => {
      setCart(updatedCart);
      queryClient.setQueryData(CART_QUERY_KEY, updatedCart);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (params: {
      productId: string;
      channelBrandSlug?: string;
    }) => {
      const payload: CartSyncPayload = {
        action: 'removeProductFromCart',
        channelBrandSlug: params.channelBrandSlug,
        cartProducts: [
          {
            productId: params.productId,
            quantity: 0,
          },
        ],
      };

      const response = await apiClient.delete<CartDetailDto>('/cart/items', {
        body: JSON.stringify(payload),
      });
      return response.data;
    },
    onSuccess: (updatedCart) => {
      setCart(updatedCart);
      queryClient.setQueryData(CART_QUERY_KEY, updatedCart);
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete<CartDetailDto>('/cart');
      return response.data;
    },
    onSuccess: (emptyCart) => {
      setCart(emptyCart);
      queryClient.setQueryData(CART_QUERY_KEY, emptyCart);
    },
  });

  return {
    cart,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isExpired,
    itemCount: cart?.itemCount ?? 0,
    estimatedSubtotal: cart?.estimatedSubtotal ?? '0.00',
    isOpen,
    openCart,
    closeCart,
    toggleCart,
    addToCart: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    updateQuantity: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    removeItem: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,
    clearCart: clearMutation.mutateAsync,
    isClearing: clearMutation.isPending,
    refetch: query.refetch,
  };
}
