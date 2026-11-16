'use client';

import * as React from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useCart } from '@/hooks/useCart';
import { useCheckoutStore } from '@/stores/checkout.store';
import { useCheckoutPreview } from '@/hooks/useCheckoutPreview';
import { FulfillmentToggle } from './FulfillmentToggle';
import { DeliveryAddressForm } from './DeliveryAddressForm';
import { PickupLocationForm } from './PickupLocationForm';
import { SubOrderCard } from './SubOrderCard';
import { UnfulfillableList } from './UnfulfillableList';
import { ContactForm } from './ContactForm';
import { NoCoverageAlert } from './NoCoverageAlert';
import { CheckoutSummary } from './CheckoutSummary';
import { CheckoutSkeleton } from './CheckoutSkeleton';
import { useShopperProfile, useShopperAddresses } from '@/hooks/useShopperAccount';

export function CheckoutView() {
  const { cart, isExpired } = useCart();
  const {
    fulfillmentType,
    contact,
    deliveryAddress,
    setContact,
    setDeliveryAddress,
    setZip,
    setPreferredDispensaryId,
    setItemOverride,
  } = useCheckoutStore();

  const { data: shopperProfile } = useShopperProfile();
  const { data: shopperAddresses = [] } = useShopperAddresses();

  // Pre-fill shopper profile preferences (homeZip, defaultStore)
  React.useEffect(() => {
    if (shopperProfile) {
      if (shopperProfile.homeZip && !deliveryAddress.line1) {
        setZip(shopperProfile.homeZip);
      }
      if (shopperProfile.defaultDispensaryId) {
        setPreferredDispensaryId(shopperProfile.defaultDispensaryId);
      }
    }
  }, [shopperProfile, setZip, setPreferredDispensaryId]);

  // Pre-fill default saved address
  React.useEffect(() => {
    if (shopperAddresses.length > 0 && !deliveryAddress.line1) {
      const defaultAddr = shopperAddresses.find((a: any) => a.isDefault) || shopperAddresses[0];
      if (defaultAddr) {
        setDeliveryAddress({
          line1: defaultAddr.line1,
          line2: defaultAddr.line2 || '',
          city: defaultAddr.city,
          state: defaultAddr.state,
          zip: defaultAddr.zip,
        });
      }
    }
  }, [shopperAddresses, setDeliveryAddress]);

  const {
    preview,
    subOrders,
    unfulfillable,
    total,
    isLoadingPreview,
    isFetchingPreview,
    previewError,
    isNoCoverage,
    activeZip,
    hasValidZipForDelivery,
    placeOrder,
    isPlacingOrder,
    switchToPickup,
    removeCartItem,
    isRemovingCartItem,
    refetchPreview,
  } = useCheckoutPreview();

  // Form validity check
  const isContactValid = Boolean(
    contact.firstName?.trim() &&
      contact.lastName?.trim() &&
      contact.email?.trim() &&
      contact.phone?.trim()
  );

  const isAddressValid =
    fulfillmentType === 'PICKUP' ||
    (Boolean(deliveryAddress.line1?.trim() && deliveryAddress.city?.trim()) &&
      hasValidZipForDelivery);

  const isFormValid = isContactValid && isAddressValid;

  const getValidationMessage = () => {
    if (fulfillmentType === 'DELIVERY' && !hasValidZipForDelivery) {
      return 'Please enter a valid 5-digit delivery ZIP code.';
    }
    if (fulfillmentType === 'DELIVERY' && !deliveryAddress.line1?.trim()) {
      return 'Please enter your street address for delivery.';
    }
    if (!isContactValid) {
      return 'Please fill in all customer contact details.';
    }
    return null;
  };

  // State 2: Loading State
  if (!cart) {
    return <CheckoutSkeleton />;
  }

  // State 3: Empty State (Empty Cart)
  if (cart.items.length === 0) {
    return (
      <EmptyState
        title="Your Cart is Empty"
        description="Add legal cannabis products from our live shopping stream or catalog to begin checkout."
        action={{
          label: 'Explore Cannabis Catalog',
          href: '/shop',
        }}
      />
    );
  }

  // State 3b: Cart Expired
  if (isExpired) {
    return (
      <EmptyState
        title="Cart Reservation Expired"
        description="Cannabis product reservations are held for 30 minutes to ensure inventory accuracy. Please return to the shop to re-add your items."
        action={{
          label: 'Return to Catalog',
          href: '/shop',
        }}
      />
    );
  }

  return (
    <div className="space-y-8" data-testid="checkout-view">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/cart"
              className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Return to Cart
            </Link>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            Cannabis Checkout
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Multi-dispensary routing across New York legal retail partners.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isFetchingPreview && !isLoadingPreview && (
            <Badge variant="outline" className="text-xs border-border text-muted-foreground animate-pulse">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Refreshing allocation...
            </Badge>
          )}
          <Badge variant="outline" className="border-accent text-accent text-xs font-semibold">
            Licensed NY Dispensaries
          </Badge>
        </div>
      </div>

      {/* Main Checkout Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Fulfillment, Split Cards, Out of stock fixes */}
        <div className="lg:col-span-7 space-y-6">
          {/* Fulfillment Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                1. Select Fulfillment Method
              </span>
            </div>
            <FulfillmentToggle />
          </div>

          {/* Delivery Address or Pickup Location Form */}
          <div className="p-5 rounded-2xl border border-border bg-card text-foreground shadow-sm">
            {fulfillmentType === 'DELIVERY' ? (
              <DeliveryAddressForm />
            ) : (
              <PickupLocationForm />
            )}
          </div>

          {/* No Coverage Alert (AC-FUL-01) */}
          {isNoCoverage && (
            <NoCoverageAlert
              zip={activeZip}
              onSwitchToPickup={switchToPickup}
            />
          )}

          {/* Out of Stock Alert & Resolution (AC-OOS-01) */}
          {unfulfillable.length > 0 && (
            <UnfulfillableList
              unfulfillable={unfulfillable}
              onSwitchToStore={(productId, dispensaryId) => {
                setItemOverride(productId, dispensaryId);
              }}
              onRemoveItem={(productId) => {
                removeCartItem(productId);
              }}
              isRemoving={isRemovingCartItem}
            />
          )}

          {/* Dispensary Split Cards (AC-HRS-01, AC-DLH-01, AC-SEL-01) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                2. Dispensary Allocation ({subOrders.length})
              </span>
              {subOrders.length > 1 && (
                <span className="text-xs text-muted-foreground">
                  Order split across multiple dispensaries
                </span>
              )}
            </div>

            {isLoadingPreview ? (
              <div className="p-8 rounded-2xl border border-border bg-card/40 text-center space-y-3">
                <RefreshCw className="h-6 w-6 mx-auto animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">
                  Evaluating licensed store inventory and distance...
                </p>
              </div>
            ) : subOrders.length === 0 && !isNoCoverage ? (
              <div className="p-6 rounded-2xl border border-border bg-card text-center text-xs text-muted-foreground">
                Enter your delivery address or pickup ZIP above to preview dispensary routing.
              </div>
            ) : (
              subOrders.map((subOrder) => (
                <SubOrderCard
                  key={subOrder.dispensaryId}
                  subOrder={subOrder}
                  onChangeStore={(newDispensaryId) => {
                    // Update all items in this sub-order to the chosen dispensary
                    subOrder.items.forEach((item) => {
                      setItemOverride(item.productId, newDispensaryId);
                    });
                    setPreferredDispensaryId(newDispensaryId);
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Column: Contact Info & Sticky Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              3. Guest Contact Details
            </span>
            <ContactForm />
          </div>

          <div className="sticky top-24">
            <CheckoutSummary
              total={total}
              subOrderCount={subOrders.length}
              itemCount={cart.itemCount}
              onPlaceOrder={placeOrder}
              isPlacingOrder={isPlacingOrder}
              isLoadingPreview={isLoadingPreview}
              hasUnfulfillableItems={unfulfillable.length > 0}
              isNoCoverage={isNoCoverage}
              isFormValid={isFormValid}
              validationMessage={getValidationMessage()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

