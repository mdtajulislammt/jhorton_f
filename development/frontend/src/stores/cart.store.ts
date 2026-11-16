import { create } from 'zustand';
import { CartDetailDto } from '@/server/cart/types';

interface CartState {
  cart: CartDetailDto | null;
  isOpen: boolean;
  isExpired: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setCart: (cart: CartDetailDto | null) => void;
  setExpired: (isExpired: boolean) => void;
}

export const useCartStore = create<CartState>((set) => ({
  cart: null,
  isOpen: false,
  isExpired: false,
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  setCart: (cart) => set({ cart, isExpired: false }),
  setExpired: (isExpired) => set({ isExpired }),
}));
