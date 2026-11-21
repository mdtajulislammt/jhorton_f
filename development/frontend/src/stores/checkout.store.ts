import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type FulfillmentType = 'PICKUP' | 'DELIVERY';

export interface DeliveryAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface CheckoutState {
  fulfillmentType: FulfillmentType;
  zip: string;
  /** Coverage area for the ZIP (e.g. "Brooklyn"), from GET /api/dispensaries. Shown in the header. */
  zipArea: string | null;
  deliveryAddress: DeliveryAddress;
  contact: ContactInfo;
  excludeProductIds: string[];
  saveToProfile: boolean;

  // Actions
  setFulfillmentType: (type: FulfillmentType) => void;
  setZip: (zip: string, area?: string | null) => void;
  setDeliveryAddress: (address: Partial<DeliveryAddress>) => void;
  setContact: (contact: Partial<ContactInfo>) => void;
  setExcludeProductIds: (ids: string[]) => void;
  addExcludeProductId: (id: string) => void;
  removeExcludeProductId: (id: string) => void;
  clearExcludeProductIds: () => void;
  setSaveToProfile: (save: boolean) => void;
  resetCheckout: () => void;
}

const initialAddress: DeliveryAddress = {
  line1: '',
  line2: '',
  city: 'New York',
  state: 'NY',
  zip: '10001',
};

const initialContact: ContactInfo = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
};

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      fulfillmentType: 'DELIVERY',
      zip: '10001',
      zipArea: 'Manhattan',
      deliveryAddress: initialAddress,
      contact: initialContact,
      excludeProductIds: [],
      saveToProfile: false,

      setFulfillmentType: (fulfillmentType) => set({ fulfillmentType }),

      setZip: (zip, area = null) =>
        set((state) => ({
          zip,
          zipArea: area,
          deliveryAddress: { ...state.deliveryAddress, zip },
        })),

      setDeliveryAddress: (addressUpdates) =>
        set((state) => {
          const updated = { ...state.deliveryAddress, ...addressUpdates };
          return {
            deliveryAddress: updated,
            zip: updated.zip || state.zip,
          };
        }),

      setContact: (contactUpdates) =>
        set((state) => ({
          contact: { ...state.contact, ...contactUpdates },
        })),

      setExcludeProductIds: (excludeProductIds) => set({ excludeProductIds }),

      addExcludeProductId: (id) =>
        set((state) => ({
          excludeProductIds: Array.from(new Set([...state.excludeProductIds, id])),
        })),

      removeExcludeProductId: (id) =>
        set((state) => ({
          excludeProductIds: state.excludeProductIds.filter((item) => item !== id),
        })),

      clearExcludeProductIds: () => set({ excludeProductIds: [] }),

      setSaveToProfile: (saveToProfile) => set({ saveToProfile }),

      resetCheckout: () =>
        set({
          fulfillmentType: 'DELIVERY',
          zip: '10001',
          zipArea: 'Manhattan',
          deliveryAddress: initialAddress,
          contact: initialContact,
          excludeProductIds: [],
          saveToProfile: false,
        }),
    }),
    {
      name: 'owtlet_checkout_store',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
      partialize: (state) => ({
        fulfillmentType: state.fulfillmentType,
        zip: state.zip,
        zipArea: state.zipArea,
        deliveryAddress: state.deliveryAddress,
        contact: state.contact,
        excludeProductIds: state.excludeProductIds,
        saveToProfile: state.saveToProfile,
      }),
    }
  )
);

