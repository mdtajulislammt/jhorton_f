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

export interface ItemOverride {
  productId: string;
  dispensaryId: string;
}

interface CheckoutState {
  fulfillmentType: FulfillmentType;
  zip: string;
  /** Coverage area for the ZIP (e.g. "Brooklyn"), from GET /api/dispensaries. Shown in the header. */
  zipArea: string | null;
  deliveryAddress: DeliveryAddress;
  contact: ContactInfo;
  preferredDispensaryId: string | null;
  itemOverrides: ItemOverride[];
  saveToProfile: boolean;

  // Actions
  setFulfillmentType: (type: FulfillmentType) => void;
  setZip: (zip: string, area?: string | null) => void;
  setDeliveryAddress: (address: Partial<DeliveryAddress>) => void;
  setContact: (contact: Partial<ContactInfo>) => void;
  setPreferredDispensaryId: (dispensaryId: string | null) => void;
  setItemOverride: (productId: string, dispensaryId: string) => void;
  removeItemOverride: (productId: string) => void;
  clearItemOverrides: () => void;
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
      preferredDispensaryId: null,
      itemOverrides: [],
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

      setPreferredDispensaryId: (preferredDispensaryId) =>
        set({ preferredDispensaryId }),

      setItemOverride: (productId, dispensaryId) =>
        set((state) => ({
          itemOverrides: [
            ...state.itemOverrides.filter((o) => o.productId !== productId),
            { productId, dispensaryId },
          ],
        })),

      removeItemOverride: (productId) =>
        set((state) => ({
          itemOverrides: state.itemOverrides.filter((o) => o.productId !== productId),
        })),

      clearItemOverrides: () => set({ itemOverrides: [], preferredDispensaryId: null }),

      setSaveToProfile: (saveToProfile) => set({ saveToProfile }),

      resetCheckout: () =>
        set({
          fulfillmentType: 'DELIVERY',
          zip: '10001',
          zipArea: 'Manhattan',
          deliveryAddress: initialAddress,
          contact: initialContact,
          preferredDispensaryId: null,
          itemOverrides: [],
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
        saveToProfile: state.saveToProfile,
      }),
    }
  )
);

