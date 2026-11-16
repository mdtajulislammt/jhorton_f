'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShopperProfileDto,
  ShopperAddressDto,
  ShopperOrderSummaryDto,
  CreateShopperAddressInput,
  UpdateShopperAddressInput,
  UpdateShopperProfileInput,
} from '@/types/api.generated';

async function fetchShopperProfile(): Promise<ShopperProfileDto | null> {
  const res = await fetch('/api/account/profile');
  if (res.status === 401) {
    return null;
  }
  if (!res.ok) {
    throw new Error('Failed to fetch profile');
  }
  const json = await res.json();
  return json.data;
}

export function useShopperProfile() {
  try {
    return useQuery({
      queryKey: ['shopper', 'profile'],
      queryFn: fetchShopperProfile,
      retry: false,
      staleTime: 60 * 1000,
    });
  } catch {
    return { data: null, isLoading: false } as any;
  }
}

export function useUpdateShopperProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateShopperProfileInput) => {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to update profile');
      }
      return json.data as ShopperProfileDto;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['shopper', 'profile'], updated);
      queryClient.invalidateQueries({ queryKey: ['shopper', 'profile'] });
    },
  });
}

async function fetchShopperAddresses(): Promise<ShopperAddressDto[]> {
  const res = await fetch('/api/account/addresses');
  if (res.status === 401) return [];
  if (!res.ok) throw new Error('Failed to fetch addresses');
  const json = await res.json();
  return json.data?.items || [];
}

export function useShopperAddresses() {
  try {
    return useQuery({
      queryKey: ['shopper', 'addresses'],
      queryFn: fetchShopperAddresses,
      retry: false,
      staleTime: 60 * 1000,
    });
  } catch {
    return { data: [], isLoading: false } as any;
  }
}

export function useCreateShopperAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateShopperAddressInput) => {
      const res = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to create address');
      return json.data as ShopperAddressDto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopper', 'addresses'] });
    },
  });
}

export function useUpdateShopperAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateShopperAddressInput;
    }) => {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to update address');
      return json.data as ShopperAddressDto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopper', 'addresses'] });
    },
  });
}

export function useDeleteShopperAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to delete address');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopper', 'addresses'] });
    },
  });
}

async function fetchShopperOrders(): Promise<ShopperOrderSummaryDto[]> {
  const res = await fetch('/api/account/orders');
  if (res.status === 401) return [];
  if (!res.ok) throw new Error('Failed to fetch orders');
  const json = await res.json();
  return json.data?.items || [];
}

export function useShopperOrders() {
  try {
    return useQuery({
      queryKey: ['shopper', 'orders'],
      queryFn: fetchShopperOrders,
      retry: false,
      staleTime: 60 * 1000,
    });
  } catch {
    return { data: [], isLoading: false } as any;
  }
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/account/logout', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to logout');
      return res.json();
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/account/login';
    },
  });
}
