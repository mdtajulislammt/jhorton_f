'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { CART_QUERY_KEY, useCart } from '@/hooks/useCart';
import { CartVendorDto, CartVendorWarningDto } from '@/types/api.generated';

export const CART_VENDORS_QUERY_KEY = ['cart-vendors'] as const;
export const CART_WARNINGS_QUERY_KEY = ['cart-warnings'] as const;

export interface UseCartVendorsOptions {
  zip?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export function useCartVendors(options: UseCartVendorsOptions = {}) {
  const queryClient = useQueryClient();
  const { cart } = useCart();

  const queryParams = new URLSearchParams();
  if (options.zip) queryParams.set('zip', options.zip);
  if (options.lat != null) queryParams.set('lat', String(options.lat));
  if (options.lng != null) queryParams.set('lng', String(options.lng));

  const vendorsQuery = useQuery({
    queryKey: [...CART_VENDORS_QUERY_KEY, options.zip, options.lat, options.lng, cart?.itemCount ?? 0],
    queryFn: async () => {
      const qs = queryParams.toString();
      const url = `/cart/vendors${qs ? `?${qs}` : ''}`;
      const res = await apiClient.get<{
        vendors: CartVendorDto[];
        selectedDispensaryId: string | null;
        selectionSource: string | null;
      }>(url);
      return res.data;
    },
    enabled: Boolean(cart && cart.items.length > 0),
    staleTime: 1000 * 30,
  });

  const selectedDispensaryId =
    cart?.selectedDispensaryId || vendorsQuery.data?.selectedDispensaryId || null;

  const warningsQuery = useQuery({
    queryKey: [...CART_WARNINGS_QUERY_KEY, selectedDispensaryId, cart?.itemCount ?? 0],
    queryFn: async () => {
      if (!selectedDispensaryId) return [];
      const res = await apiClient.get<CartVendorWarningDto[]>(
        `/cart/warnings?dispensaryId=${encodeURIComponent(selectedDispensaryId)}`
      );
      return res.data;
    },
    enabled: Boolean(selectedDispensaryId && cart && cart.items.length > 0),
    staleTime: 1000 * 15,
  });

  const selectVendorMutation = useMutation({
    mutationFn: async (dispensaryId: string) => {
      const res = await apiClient.put<any>('/cart/vendor', { dispensaryId });
      return res.data;
    },
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(CART_QUERY_KEY, updatedCart);
      queryClient.invalidateQueries({ queryKey: CART_VENDORS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CART_WARNINGS_QUERY_KEY });
    },
  });

  return {
    vendors: vendorsQuery.data?.vendors || [],
    selectedDispensaryId,
    selectionSource: vendorsQuery.data?.selectionSource || cart?.selectionSource || null,
    isLoadingVendors: vendorsQuery.isLoading,
    warnings: warningsQuery.data || [],
    isLoadingWarnings: warningsQuery.isLoading,
    selectVendor: selectVendorMutation.mutateAsync,
    isSelectingVendor: selectVendorMutation.isPending,
    refetchVendors: vendorsQuery.refetch,
    refetchWarnings: warningsQuery.refetch,
  };
}

