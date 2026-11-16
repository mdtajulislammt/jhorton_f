import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { FulfillmentToggle } from '@/components/modules/checkout/FulfillmentToggle';
import { SubOrderCard } from '@/components/modules/checkout/SubOrderCard';
import { UnfulfillableList } from '@/components/modules/checkout/UnfulfillableList';
import { NoCoverageAlert } from '@/components/modules/checkout/NoCoverageAlert';
import { ContactForm } from '@/components/modules/checkout/ContactForm';
import { CheckoutSummary } from '@/components/modules/checkout/CheckoutSummary';
import { CheckoutSkeleton } from '@/components/modules/checkout/CheckoutSkeleton';
import { StorePickerDialog } from '@/components/modules/checkout/StorePickerDialog';
import { DeliveryAddressForm } from '@/components/modules/checkout/DeliveryAddressForm';
import { PickupLocationForm } from '@/components/modules/checkout/PickupLocationForm';
import { useCheckoutStore } from '@/stores/checkout.store';
import { AllocatedSubOrder, UnfulfillableLine } from '@/server/distribution/types';

const renderClean = (component: React.ReactElement) => {
  return renderToString(component).replace(/<!--.*?-->/g, '');
};

describe('Checkout UI Components (Friday & Jarvis UI Verification - TASK-012)', () => {
  beforeEach(() => {
    useCheckoutStore.getState().resetCheckout();
  });

  describe('FulfillmentToggle', () => {
    it('renders Delivery and Pickup options with correct initial state', () => {
      useCheckoutStore.setState({ fulfillmentType: 'DELIVERY' });
      const html = renderClean(<FulfillmentToggle />);

      expect(html).toContain('Delivery');
      expect(html).toContain('Dispensary Pickup');
      expect(html).toContain('aria-checked="true"');
      expect(html).toContain('data-testid="toggle-delivery"');
      expect(html).toContain('data-testid="toggle-pickup"');
    });

    it('renders Pickup as active when selected in store', () => {
      useCheckoutStore.setState({ fulfillmentType: 'PICKUP' });
      const html = renderClean(<FulfillmentToggle value="PICKUP" />);

      // The pickup button should have checked true
      expect(html).toContain('data-testid="toggle-pickup"');
      expect(html).toMatch(/aria-checked="true"[^>]*data-testid="toggle-pickup"/);
    });
  });

  describe('SubOrderCard (AC-HRS-01, AC-DLH-01, AC-SEL-01)', () => {
    const mockPickupSubOrder: AllocatedSubOrder = {
      dispensaryId: 'disp-1',
      dispensaryName: 'Gotham Greenery NYC',
      fulfillmentType: 'PICKUP',
      assignment: 'AUTO',
      channelBrandId: null,
      channelBrand: null,
      isOpenNow: true,
      hoursToday: { opensAt: '09:00', closesAt: '21:00' },
      isDeliveringNow: false,
      deliveryHoursToday: null,
      distanceMiles: 1.4,
      handoffChannel: 'LEAFLY',
      items: [
        {
          productId: 'prod-1',
          name: 'Blue Dream Live Resin 1g',
          quantity: 2,
          unitPrice: '45.00',
          priceMode: 'OWTLET',
          lineTotal: '90.00',
        },
      ],
      subtotal: '90.00',
      alternatives: [
        {
          dispensaryId: 'disp-2',
          dispensaryName: 'Empire Express Delivery',
          canSupplyAll: true,
          missingProductIds: [],
          distanceMiles: 2.8,
          isOpenNow: true,
        },
      ],
    };

    it('renders store name, distance, and NY store hours for PICKUP (AC-HRS-01)', () => {
      const html = renderClean(
        <SubOrderCard subOrder={mockPickupSubOrder} onChangeStore={vi.fn()} />
      );

      expect(html).toContain('Gotham Greenery NYC');
      expect(html).toContain('1.4 mi away');
      expect(html).toContain('Store Hours:');
      expect(html).toContain('09:00 – 21:00 (NY Time)');
      expect(html).toContain('Open for Pickup');
      expect(html).toContain('Auto-selected');
    });

    it('renders delivery hours and delivering now for DELIVERY (AC-DLH-01)', () => {
      const deliverySubOrder: AllocatedSubOrder = {
        ...mockPickupSubOrder,
        fulfillmentType: 'DELIVERY',
        assignment: 'SHOPPER_CHANGED',
        isOpenNow: true,
        isDeliveringNow: true,
        deliveryHoursToday: { opensAt: '10:00', closesAt: '22:00' },
      };

      const html = renderClean(
        <SubOrderCard subOrder={deliverySubOrder} onChangeStore={vi.fn()} />
      );

      expect(html).toContain('Delivery Hours:');
      expect(html).toContain('10:00 – 22:00 (NY Time)');
      expect(html).toContain('Delivering Now');
      expect(html).toContain('You chose this store');
    });

    it('displays single Owtlet Live Show Price indicator', () => {
      const html = renderClean(
        <SubOrderCard subOrder={mockPickupSubOrder} onChangeStore={vi.fn()} />
      );

      expect(html).toContain('Live Show Price');
      expect(html).toContain('Blue Dream Live Resin 1g');
      expect(html).toContain('$90.00');
    });

    it('displays Change Store button', () => {
      const html = renderClean(
        <SubOrderCard subOrder={mockPickupSubOrder} onChangeStore={vi.fn()} />
      );

      expect(html).toContain('Change Store');
      expect(html).toContain('data-testid="change-store-btn-disp-1"');
    });
  });

  describe('UnfulfillableList (AC-OOS-01)', () => {
    const mockUnfulfillable: UnfulfillableLine[] = [
      {
        productId: 'prod-out',
        name: 'Sour Diesel Pre-Roll 5-pack',
        reason: 'NOT_IN_STOCK_FOR_ZIP',
        suggestions: [
          {
            dispensaryId: 'disp-alt',
            dispensaryName: 'Kings County Cannabis Co.',
            fulfillmentTypes: ['PICKUP', 'DELIVERY'],
            distanceMiles: 3.1,
          },
        ],
      },
    ];

    it('renders out-of-stock items, warnings, and suggested alternatives', () => {
      const html = renderClean(
        <UnfulfillableList
          unfulfillable={mockUnfulfillable}
          onSwitchToStore={vi.fn()}
          onRemoveItem={vi.fn()}
        />
      );

      expect(html).toContain('1 Item Out of Stock');
      expect(html).toContain('Sour Diesel Pre-Roll 5-pack');
      expect(html).toContain('Out of stock for this delivery area');
      expect(html).toContain('Kings County Cannabis Co.');
      expect(html).toContain('3.1 mi');
      expect(html).toContain('Switch to this store');
      expect(html).toContain('Remove Item');
    });

    it('returns null when unfulfillable list is empty', () => {
      const html = renderClean(
        <UnfulfillableList
          unfulfillable={[]}
          onSwitchToStore={vi.fn()}
          onRemoveItem={vi.fn()}
        />
      );

      expect(html).toBe('');
    });
  });

  describe('NoCoverageAlert (AC-FUL-01)', () => {
    it('renders out-of-coverage message and Switch to Pickup button', () => {
      const html = renderClean(
        <NoCoverageAlert zip="13001" onSwitchToPickup={vi.fn()} />
      );

      expect(html).toContain('Delivery Unavailable for ZIP 13001');
      expect(html).toContain('Manhattan, Brooklyn, Queens, Westchester County, and Long Island');
      expect(html).toContain('Switch to Dispensary Pickup');
      expect(html).toContain('data-testid="switch-to-pickup-btn"');
    });
  });

  describe('ContactForm (AC-PRF-01, AC-SEC-01)', () => {
    it('renders guest contact inputs and Zero-ID compliance statement', () => {
      const html = renderClean(<ContactForm />);

      expect(html).toContain('Customer Contact Info');
      expect(html).toContain('First Name');
      expect(html).toContain('Last Name');
      expect(html).toContain('Email Address');
      expect(html).toContain('Phone Number');
      expect(html).toContain('Sign in for faster checkout');
      expect(html).toContain('Zero-ID &amp; Zero-Payment Policy');
      expect(html).toContain('Save contact details for faster future checkout');
    });
  });

  describe('CheckoutSummary', () => {
    it('renders items count, dispensary count, total, and Place Order button', () => {
      const html = renderClean(
        <CheckoutSummary
          total="125.00"
          subOrderCount={2}
          itemCount={3}
          onPlaceOrder={vi.fn()}
          isPlacingOrder={false}
          isLoadingPreview={false}
          hasUnfulfillableItems={false}
          isNoCoverage={false}
          isFormValid={true}
        />
      );

      expect(html).toContain('Order Summary');
      expect(html).toContain('3 items');
      expect(html).toContain('2 dispensary orders');
      expect(html).toContain('$125.00');
      expect(html).toContain('Place Cannabis Order');
      expect(html).toContain('data-testid="place-order-btn"');
      expect(html).not.toContain('disabled=""');
    });

    it('disables Place Order when unfulfillable items exist', () => {
      const html = renderClean(
        <CheckoutSummary
          total="125.00"
          subOrderCount={1}
          itemCount={2}
          onPlaceOrder={vi.fn()}
          isPlacingOrder={false}
          isLoadingPreview={false}
          hasUnfulfillableItems={true}
          isNoCoverage={false}
          isFormValid={true}
        />
      );

      expect(html).toContain('disabled=""');
    });

    it('disables Place Order when coverage is invalid', () => {
      const html = renderClean(
        <CheckoutSummary
          total="125.00"
          subOrderCount={0}
          itemCount={2}
          onPlaceOrder={vi.fn()}
          isPlacingOrder={false}
          isLoadingPreview={false}
          hasUnfulfillableItems={false}
          isNoCoverage={true}
          isFormValid={true}
        />
      );

      expect(html).toContain('disabled=""');
    });
  });

  describe('StorePickerDialog', () => {
    it('renders alternative dispensaries with distance and stock badges', () => {
      const html = renderClean(
        <StorePickerDialog
          isOpen={true}
          onClose={vi.fn()}
          currentStoreName="Gotham Greenery NYC"
          alternatives={[
            {
              dispensaryId: 'alt-1',
              dispensaryName: 'Empire Express Delivery',
              canSupplyAll: true,
              missingProductIds: [],
              distanceMiles: 2.3,
              isOpenNow: true,
            },
          ]}
          onSelectStore={vi.fn()}
        />
      );

      expect(html).toContain('Choose Alternative Dispensary');
      expect(html).toContain('Empire Express Delivery');
      expect(html).toContain('In Stock (All Items)');
      expect(html).toContain('2.3 mi away');
      expect(html).toContain('Select Store');
    });

    it('returns null when isOpen is false', () => {
      const html = renderClean(
        <StorePickerDialog
          isOpen={false}
          onClose={vi.fn()}
          currentStoreName="Gotham Greenery NYC"
          alternatives={[]}
          onSelectStore={vi.fn()}
        />
      );

      expect(html).toBe('');
    });
  });

  describe('CheckoutSkeleton', () => {
    it('renders loading skeleton layout', () => {
      const html = renderClean(<CheckoutSkeleton />);

      expect(html).toContain('data-testid="checkout-skeleton"');
      expect(html).toContain('animate-pulse');
    });
  });

  describe('Address & Location Forms', () => {
    it('renders delivery address fields for NY delivery', () => {
      const html = renderClean(<DeliveryAddressForm />);

      expect(html).toContain('Street Address');
      expect(html).toContain('City');
      expect(html).toContain('State');
      expect(html).toContain('NY');
      expect(html).toContain('ZIP Code');
    });

    it('renders pickup proximity ZIP input', () => {
      const html = renderClean(<PickupLocationForm />);

      expect(html).toContain('Pickup Location (Sort by Proximity)');
      expect(html).toContain('10001');
    });
  });

  describe('Checkout Store State Management', () => {
    it('updates fulfillment type, addresses, and item overrides correctly', () => {
      const store = useCheckoutStore.getState();

      store.setFulfillmentType('PICKUP');
      expect(useCheckoutStore.getState().fulfillmentType).toBe('PICKUP');

      store.setZip('11201');
      expect(useCheckoutStore.getState().zip).toBe('11201');

      store.setDeliveryAddress({ line1: '456 Atlantic Ave', city: 'Brooklyn', zip: '11201' });
      expect(useCheckoutStore.getState().deliveryAddress.line1).toBe('456 Atlantic Ave');

      store.setItemOverride('prod-1', 'disp-custom');
      expect(useCheckoutStore.getState().itemOverrides).toEqual([
        { productId: 'prod-1', dispensaryId: 'disp-custom' },
      ]);

      store.removeItemOverride('prod-1');
      expect(useCheckoutStore.getState().itemOverrides).toEqual([]);
    });
  });
});
