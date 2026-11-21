import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { FulfillmentToggle } from '@/components/modules/checkout/FulfillmentToggle';
import { NoCoverageAlert } from '@/components/modules/checkout/NoCoverageAlert';
import { ContactForm } from '@/components/modules/checkout/ContactForm';
import { CheckoutSummary } from '@/components/modules/checkout/CheckoutSummary';
import { CheckoutSkeleton } from '@/components/modules/checkout/CheckoutSkeleton';
import { DeliveryAddressForm } from '@/components/modules/checkout/DeliveryAddressForm';
import { PickupLocationForm } from '@/components/modules/checkout/PickupLocationForm';
import { useCheckoutStore } from '@/stores/checkout.store';

const renderClean = (component: React.ReactElement) => {
  return renderToString(component).replace(/<!--.*?-->/g, '');
};

describe('Checkout UI Components (Single Vendor Checkout)', () => {
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

      expect(html).toContain('data-testid="toggle-pickup"');
      expect(html).toMatch(/aria-checked="true"[^>]*data-testid="toggle-pickup"/);
    });
  });

  describe('NoCoverageAlert (AC-FUL-01)', () => {
    it('renders out-of-coverage message and Switch to Pickup button', () => {
      const html = renderClean(
        <NoCoverageAlert zip="13001" onSwitchToPickup={vi.fn()} />
      );

      expect(html).toContain('Delivery Unavailable for ZIP 13001');
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
    it('renders items count, dispensary count, total, and Continue to partner checkout button', () => {
      const html = renderClean(
        <CheckoutSummary
          total="125.00"
          subOrderCount={1}
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
      expect(html).toContain('1 dispensary order');
      expect(html).toContain('$125.00');
      expect(html).toContain('Continue to partner checkout');
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
    it('updates fulfillment type, addresses, and exclude product IDs correctly', () => {
      const store = useCheckoutStore.getState();

      store.setFulfillmentType('PICKUP');
      expect(useCheckoutStore.getState().fulfillmentType).toBe('PICKUP');

      store.setZip('11201');
      expect(useCheckoutStore.getState().zip).toBe('11201');

      store.setDeliveryAddress({ line1: '456 Atlantic Ave', city: 'Brooklyn', zip: '11201' });
      expect(useCheckoutStore.getState().deliveryAddress.line1).toBe('456 Atlantic Ave');

      store.addExcludeProductId('prod-1');
      expect(useCheckoutStore.getState().excludeProductIds).toEqual(['prod-1']);

      store.removeExcludeProductId('prod-1');
      expect(useCheckoutStore.getState().excludeProductIds).toEqual([]);
    });
  });
});
