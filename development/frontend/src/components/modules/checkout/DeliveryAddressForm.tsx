'use client';

import * as React from 'react';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCheckoutStore } from '@/stores/checkout.store';

interface DeliveryAddressFormProps {
  className?: string;
}

export function DeliveryAddressForm({ className }: DeliveryAddressFormProps) {
  const { deliveryAddress, setDeliveryAddress, setZip } = useCheckoutStore();

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 5);
    setZip(val);
  };

  return (
    <div className={className} data-testid="delivery-address-form">
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-foreground">
        <MapPin className="h-4 w-4 text-primary" />
        <span>Delivery Address (New York)</span>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="address-line1" className="block text-xs font-medium text-foreground mb-1">
            Street Address <span className="text-destructive">*</span>
          </label>
          <Input
            id="address-line1"
            name="line1"
            type="text"
            required
            placeholder="e.g. 125 W 25th St"
            value={deliveryAddress.line1}
            onChange={(e) => setDeliveryAddress({ line1: e.target.value })}
            className="h-11 rounded-xl text-sm"
          />
        </div>

        <div>
          <label htmlFor="address-line2" className="block text-xs font-medium text-muted-foreground mb-1">
            Apartment, suite, unit (optional)
          </label>
          <Input
            id="address-line2"
            name="line2"
            type="text"
            placeholder="e.g. Apt 4B"
            value={deliveryAddress.line2 || ''}
            onChange={(e) => setDeliveryAddress({ line2: e.target.value })}
            className="h-11 rounded-xl text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label htmlFor="address-city" className="block text-xs font-medium text-foreground mb-1">
              City <span className="text-destructive">*</span>
            </label>
            <Input
              id="address-city"
              name="city"
              type="text"
              required
              placeholder="e.g. New York"
              value={deliveryAddress.city}
              onChange={(e) => setDeliveryAddress({ city: e.target.value })}
              className="h-11 rounded-xl text-sm"
            />
          </div>

          <div className="sm:col-span-1">
            <label htmlFor="address-state" className="block text-xs font-medium text-foreground mb-1">
              State
            </label>
            <Input
              id="address-state"
              name="state"
              type="text"
              readOnly
              value="NY"
              disabled
              className="h-11 rounded-xl text-sm bg-muted/50 cursor-not-allowed opacity-80"
            />
          </div>

          <div className="sm:col-span-1">
            <label htmlFor="address-zip" className="block text-xs font-medium text-foreground mb-1">
              ZIP Code <span className="text-destructive">*</span>
            </label>
            <Input
              id="address-zip"
              name="zip"
              type="text"
              inputMode="numeric"
              required
              maxLength={5}
              placeholder="10001"
              value={deliveryAddress.zip}
              onChange={handleZipChange}
              className="h-11 rounded-xl text-sm font-mono tracking-wider"
            />
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Delivering across Manhattan, Brooklyn, Queens, Westchester, and Long Island.
        </p>
      </div>
    </div>
  );
}

