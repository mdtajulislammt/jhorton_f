'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient, ApiError } from '@/lib/api-client';
import { useCheckoutStore } from '@/stores/checkout.store';
import { useCart } from '@/hooks/useCart';
import { toast } from '@/stores/toast.store';
import {
  DistributionResult,
  AllocatedSubOrder,
  UnfulfillableLine,
} from '@/types/api.generated';
import {
  CreateOrderInput,
  OrderCreatedDto,
} from '@/types/api.generated';

export const CHECKOUT_PREVIEW_QUERY_KEY = ['checkout-preview'] as const;

export function useCheckoutPreview() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { cart, isExpired } = useCart();

  const {
    fulfillmentType,
    zip,
    deliveryAddress,
    contact,
    excludeProductIds,
    saveToProfile,
    setFulfillmentType,
    setExcludeProductIds,
    addExcludeProductId,
    removeExcludeProductId,
    clearExcludeProductIds,
    resetCheckout,
  } = useCheckoutStore();

  const activeZip = (fulfillmentType === 'DELIVERY' ? deliveryAddress.zip : zip).trim();
  const hasValidZipForDelivery = /^\d{5}$/.test(activeZip);

  // Preview Query
  const previewQuery = useQuery<DistributionResult, ApiError>({
    queryKey: [
      ...CHECKOUT_PREVIEW_QUERY_KEY,
      fulfillmentType,
      activeZip,
      excludeProductIds,
      cart?.itemCount ?? 0,
    ],
    queryFn: async () => {
      const payload = {
        fulfillmentType,
        zip: activeZip ? activeZip : null,
        excludeProductIds,
      };

      const res = await apiClient.post<DistributionResult>('/orders/preview', payload);
      return res.data;
    },
    enabled: Boolean(
      cart &&
        cart.items.length > 0 &&
        !isExpired &&
        (fulfillmentType === 'PICKUP' || (fulfillmentType === 'DELIVERY' && hasValidZipForDelivery))
    ),
    staleTime: 1000 * 20, // 20 seconds
    retry: (failureCount, error) => {
      if (
        error.code === 'NO_COVERAGE' ||
        error.code === 'CART_EXPIRED' ||
        error.code === 'STORE_NOT_ELIGIBLE' ||
        error.statusCode === 422 ||
        error.statusCode === 400 ||
        error.statusCode === 410
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const isNoCoverage = previewQuery.error?.code === 'NO_COVERAGE';

  // Place Order Mutation
  const placeOrderMutation = useMutation<OrderCreatedDto, ApiError, void>({
    mutationFn: async () => {
      const preview = previewQuery.data;
      if (!preview || !preview.previewHash) {
        throw {
          success: false,
          statusCode: 400,
          code: 'PREVIEW_REQUIRED',
          message: 'Please review dispensary allocation before placing your order.',
          timestamp: new Date().toISOString(),
        } as ApiError;
      }

      // Only unfulfillable items that are NOT excluded will block order
      const remainingUnfulfillable = (preview.unfulfillable || []).filter(
        (u) => !excludeProductIds.includes(u.productId)
      );

      if (remainingUnfulfillable.length > 0) {
        throw {
          success: false,
          statusCode: 422,
          code: 'UNFULFILLABLE_ITEMS',
          message: 'Please resolve or remove out-of-stock items before placing your order.',
          timestamp: new Date().toISOString(),
        } as ApiError;
      }

      if (!contact.firstName || !contact.lastName || !contact.email || !contact.phone) {
        throw {
          success: false,
          statusCode: 400,
          code: 'CONTACT_REQUIRED',
          message: 'First name, last name, email, and phone number are required.',
          timestamp: new Date().toISOString(),
        } as ApiError;
      }

      if (fulfillmentType === 'DELIVERY') {
        if (!deliveryAddress.line1 || !deliveryAddress.city || !deliveryAddress.zip) {
          throw {
            success: false,
            statusCode: 400,
            code: 'ADDRESS_REQUIRED',
            message: 'Complete street address, city, and 5-digit ZIP code are required for delivery.',
            timestamp: new Date().toISOString(),
          } as ApiError;
        }
      }

      const orderPayload: CreateOrderInput = {
        fulfillmentType,
        zip: activeZip,
        excludeProductIds,
        contact: {
          firstName: contact.firstName.trim(),
          lastName: contact.lastName.trim(),
          email: contact.email.trim(),
          phone: contact.phone.trim(),
        },
        deliveryAddress:
          fulfillmentType === 'DELIVERY'
            ? {
                line1: deliveryAddress.line1.trim(),
                line2: deliveryAddress.line2?.trim() || null,
                city: deliveryAddress.city.trim(),
                state: 'NY',
                zip: activeZip,
              }
            : null,
        saveToProfile,
        previewHash: preview.previewHash,
      };

      const res = await apiClient.post<OrderCreatedDto>('/orders', orderPayload);
      return res.data;
    },
    onSuccess: (orderData) => {
      toast.success('Order placed successfully! Redirecting to confirmation...');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      resetCheckout();
      router.push(`/order/${orderData.orderId}`);
    },
    onError: (err: ApiError) => {
      if (err.code === 'PREVIEW_STALE' || err.statusCode === 409) {
        toast.error('Store availability or pricing updated. Reviewing fresh preview...');
        previewQuery.refetch();
        return;
      }

      if (err.code === 'CART_EXPIRED' || err.statusCode === 410) {
        toast.error('Cart reservation expired. Please re-add items to your cart.');
        return;
      }

      if (err.code === 'UNFULFILLABLE_ITEMS' || err.statusCode === 422) {
        toast.error('Some items cannot be fulfilled at the selected store. See options below.');
        previewQuery.refetch();
        return;
      }

      toast.error(err.message || 'Failed to place order. Please check all details.');
    },
  });

  // Switch to pickup action (useful for no-coverage resolution)
  const switchToPickup = React.useCallback(() => {
    setFulfillmentType('PICKUP');
    toast.info('Switched fulfillment to Dispensary Pickup.');
  }, [setFulfillmentType]);

  // Remove unfulfillable line directly from cart
  const removeCartItemMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await apiClient.delete('/cart/items', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', cartProducts: [{ productId }] }),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      previewQuery.refetch();
      toast.success('Item removed from order.');
    },
    onError: () => {
      toast.error('Failed to remove item from cart.');
    },
  });

  return {
    cart,
    isCartExpired: isExpired,
    preview: previewQuery.data ?? null,
    subOrders: previewQuery.data?.subOrders ?? [],
    unfulfillable: previewQuery.data?.unfulfillable ?? [],
    previewHash: previewQuery.data?.previewHash ?? null,
    total: previewQuery.data?.total ?? cart?.estimatedSubtotal ?? '0.00',
    isLoadingPreview: previewQuery.isLoading,
    isFetchingPreview: previewQuery.isFetching,
    previewError: previewQuery.error,
    isNoCoverage,
    activeZip,
    hasValidZipForDelivery,

    // Actions
    refetchPreview: previewQuery.refetch,
    placeOrder: placeOrderMutation.mutate,
    isPlacingOrder: placeOrderMutation.isPending,
    placeOrderError: placeOrderMutation.error,
    switchToPickup,
    excludeProductIds,
    setExcludeProductIds,
    addExcludeProductId,
    removeExcludeProductId,
    clearExcludeProductIds,
    removeCartItem: removeCartItemMutation.mutate,
    isRemovingCartItem: removeCartItemMutation.isPending,
  };
}

