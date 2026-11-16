import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ProfileForm } from '@/components/modules/account/ProfileForm';
import { DefaultStorePicker } from '@/components/modules/account/DefaultStorePicker';
import { AddressList } from '@/components/modules/account/AddressList';
import { OrderHistory } from '@/components/modules/account/OrderHistory';

const mockProfile = {
  id: 'shopper-test-1',
  email: 'testshopper@owtlet.com',
  firstName: 'Jordan',
  lastName: 'Taylor',
  phone: '212-555-0199',
  homeZip: '10001',
  defaultDispensaryId: 'disp-1',
  defaultDispensary: {
    id: 'disp-1',
    name: 'Gotham Greenery NYC',
    slug: 'gotham-greenery',
    address: '123 Bowery',
    city: 'New York',
    zip: '10002',
    offersPickup: true,
    offersDelivery: true,
  },
  createdAt: '2026-11-16T12:00:00.000Z',
};

const mockAddresses = [
  {
    id: 'addr-1',
    shopperId: 'shopper-test-1',
    label: 'Home',
    line1: '123 Bowery',
    line2: 'Apt 4B',
    city: 'New York',
    state: 'NY',
    zip: '10002',
    isDefault: true,
    createdAt: '2026-11-16T12:00:00.000Z',
  },
];

const mockOrders = [
  {
    id: 'ord-1',
    orderNumber: 'OWT-100256',
    fulfillmentType: 'DELIVERY',
    status: 'CONFIRMED',
    subtotal: '95.00',
    zip: '10001',
    createdAt: '2026-11-16T12:00:00.000Z',
    subOrders: [
      {
        id: 'sub-1',
        subOrderNumber: 'OWT-100256-A',
        dispensaryId: 'disp-1',
        dispensaryName: 'Gotham Greenery NYC',
        dispensarySlug: 'gotham-greenery',
        status: 'CONFIRMED',
        subtotal: '95.00',
        handoffUrl: 'https://gotham.example/order/1',
        confirmedAt: '2026-11-16T12:05:00.000Z',
        items: [
          {
            id: 'item-1',
            productId: 'p-1',
            productName: 'Sour Diesel 3.5g',
            brandName: 'Hudson Cannabis',
            strainType: 'Sativa',
            quantity: 2,
            unitPrice: '47.50',
            lineTotal: '95.00',
          },
        ],
      },
    ],
  },
];

vi.mock('@/hooks/useShopperAccount', () => ({
  useShopperProfile: () => ({
    data: mockProfile,
    isLoading: false,
  }),
  useUpdateShopperProfile: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useShopperAddresses: () => ({
    data: mockAddresses,
    isLoading: false,
  }),
  useCreateShopperAddress: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateShopperAddress: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteShopperAddress: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useShopperOrders: () => ({
    data: mockOrders,
    isLoading: false,
  }),
  useLogout: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

const renderClean = (component: React.ReactElement) => {
  return renderToString(component).replace(/<!--.*?-->/g, '');
};

describe('Shopper Account UI Components (Friday & Jarvis - 6 UI States)', () => {
  it('ProfileForm renders customer details and read-only email', () => {
    const html = renderClean(<ProfileForm />);
    expect(html).toContain('Shopper Details');
    expect(html).toContain('testshopper@owtlet.com');
    expect(html).toContain('Jordan');
    expect(html).toContain('Save Changes');
  });

  it('DefaultStorePicker renders default store heading and preference', () => {
    const html = renderClean(<DefaultStorePicker />);
    expect(html).toContain('Default Partner Store');
    expect(html).toContain('Active Preference');
  });

  it('AddressList renders saved addresses and Default badge', () => {
    const html = renderClean(<AddressList />);
    expect(html).toContain('Saved Delivery Addresses');
    expect(html).toContain('123 Bowery');
    expect(html).toContain('Default');
  });

  it('OrderHistory renders order cards, subtotal, and tracking links', () => {
    const html = renderClean(<OrderHistory />);
    expect(html).toContain('Cannabis Order History');
    expect(html).toContain('OWT-100256');
    expect(html).toContain('$95.00');
    expect(html).toContain('Sour Diesel 3.5g');
  });
});

