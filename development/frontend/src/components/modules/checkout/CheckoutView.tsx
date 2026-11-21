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
import { useCartVendors } from '@/hooks/useCartVendors';
import { FulfillmentToggle } from './FulfillmentToggle';
import { DeliveryAddressForm } from './DeliveryAddressForm';
import { PickupLocationForm } from './PickupLocationForm';
import { ContactForm } from './ContactForm';
import { NoCoverageAlert } from './NoCoverageAlert';
import { CheckoutSummary } from './CheckoutSummary';
import { CheckoutSkeleton } from './CheckoutSkeleton';
import { VendorSelector } from './VendorSelector';
import { VendorWarningsBanner } from './VendorWarningsBanner';
import { useShopperProfile, useShopperAddresses } from '@/hooks/useShopperAccount';
import { toast } from '@/stores/toast.store';

export function CheckoutView() {
  const { cart, isExpired, removeItem, isRemoving } = useCart();
  const {
    fulfillmentType,
    contact,
    deliveryAddress,
    zip,
    setContact,
    setDeliveryAddress,
    setZip,
    excludeProductIds,
    setExcludeProductIds,
  } = useCheckoutStore();

  const { data: shopperProfile } = useShopperProfile();
  const { data: shopperAddresses = [] } = useShopperAddresses();

  const [coords, setCoords] = React.useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });
  const [zipInput, setZipInput] = React.useState(zip || '');
  const [isLocating, setIsLocating] = React.useState(false);
  const [ignoredWarnings, setIgnoredWarnings] = React.useState(false);

  // Pre-fill shopper profile preferences (homeZip)
  React.useEffect(() => {
    if (shopperProfile) {
      if (shopperProfile.homeZip && !deliveryAddress.line1) {
        setZip(shopperProfile.homeZip);
        setZipInput(shopperProfile.homeZip);
      }
    }
  }, [shopperProfile, setZip]);

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
        setZipInput(defaultAddr.zip);
      }
    }
  }, [shopperAddresses, setDeliveryAddress]);

  // Vendor hook
  const activeZip = (fulfillmentType === 'DELIVERY' ? deliveryAddress.zip : zip).trim();
  const {
    vendors,
    selectedDispensaryId,
    isLoadingVendors,
    warnings,
    selectVendor,
    isSelectingVendor,
    refetchVendors,
  } = useCartVendors({
    zip: activeZip || undefined,
    lat: coords.lat,
    lng: coords.lng,
  });

  const {
    preview,
    subOrders,
    unfulfillable,
    total,
    isLoadingPreview,
    isFetchingPreview,
    previewError,
    isNoCoverage,
    hasValidZipForDelivery,
    placeOrder,
    isPlacingOrder,
    switchToPickup,
    refetchPreview,
  } = useCheckoutPreview();

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        toast.success('Location updated for nearest partner calculation');
      },
      (err) => {
        setIsLocating(false);
        toast.error('Unable to retrieve location. Please enter your ZIP code.');
      },
      { timeout: 10000 }
    );
  };

  const handleApplyZip = () => {
    if (/^\d{5}$/.test(zipInput.trim())) {
      setZip(zipInput.trim());
      refetchVendors();
      refetchPreview();
      toast.success(`ZIP set to ${zipInput.trim()}`);
    } else {
      toast.error('Please enter a valid 5-digit ZIP code');
    }
  };

  const handleSelectVendor = async (dispensaryId: string) => {
    try {
      await selectVendor(dispensaryId);
      setIgnoredWarnings(false);
      refetchPreview();
      toast.success('Fulfillment partner updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update partner');
    }
  };

  const handleRemoveWarningItem = async (productId: string) => {
    try {
      await removeItem({ productId });
      refetchPreview();
      toast.success('Item removed from cart');
    } catch (err: any) {
      toast.error('Failed to remove item');
    }
  };

  const handleContinueWithout = () => {
    const warningProductIds = warnings.map((w) => w.productId);
    setExcludeProductIds(Array.from(new Set([...excludeProductIds, ...warningProductIds])));
    setIgnoredWarnings(true);
    refetchPreview();
    toast.info('Continuing without unavailable items');
  };

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

  const hasBlockingWarnings = warnings.length > 0 && !ignoredWarnings;
  const isFormValid = isContactValid && isAddressValid && !hasBlockingWarnings;

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
    if (hasBlockingWarnings) {
      return 'Please resolve unavailable items before continuing to partner checkout.';
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
            Select your licensed New York fulfillment dispensary partner.
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
        {/* Left Column: Fulfillment, Vendor Selection & Warnings */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Fulfillment Toggle */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              1. Fulfillment Method
            </span>
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

          {/* No Coverage Alert */}
          {isNoCoverage && (
            <NoCoverageAlert
              zip={activeZip}
              onSwitchToPickup={switchToPickup}
            />
          )}

          {/* 2. Single Fulfillment Partner Dispensary Selector */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              2. Licensed Partner Dispensary
            </span>
            <VendorSelector
              vendors={vendors}
              selectedDispensaryId={selectedDispensaryId}
              onSelectVendor={handleSelectVendor}
              isSelecting={isSelectingVendor || isLoadingVendors}
              onUseLocation={handleUseLocation}
              isLocating={isLocating}
              zipInput={zipInput}
              onZipChange={setZipInput}
              onApplyZip={handleApplyZip}
            />
          </div>

          {/* Unmapped / Unavailable Warnings Banner */}
          {warnings.length > 0 && (
            <VendorWarningsBanner
              warnings={warnings}
              onRemoveItem={handleRemoveWarningItem}
              onContinueWithout={handleContinueWithout}
              isRemoving={isRemoving}
            />
          )}
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
              subOrderCount={subOrders.length || 1}
              itemCount={cart.itemCount}
              onPlaceOrder={placeOrder}
              isPlacingOrder={isPlacingOrder}
              isLoadingPreview={isLoadingPreview}
              hasUnfulfillableItems={unfulfillable.length > 0 && !ignoredWarnings}
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
