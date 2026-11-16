'use client';

import * as React from 'react';
import { Store, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FulfillmentType, useCheckoutStore } from '@/stores/checkout.store';

interface FulfillmentToggleProps {
  className?: string;
  value?: FulfillmentType;
  onChange?: (type: FulfillmentType) => void;
}

export function FulfillmentToggle({ className, value, onChange }: FulfillmentToggleProps) {
  const { fulfillmentType: storeFulfillmentType, setFulfillmentType } = useCheckoutStore();
  const activeType = value ?? storeFulfillmentType;

  const handleSelect = (type: FulfillmentType) => {
    setFulfillmentType(type);
    if (onChange) onChange(type);
  };

  return (
    <div
      role="group"
      aria-label="Fulfillment Method"
      className={cn(
        'grid grid-cols-2 p-1.5 bg-card/60 border border-border rounded-2xl gap-2 shadow-sm',
        className
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={activeType === 'DELIVERY'}
        data-testid="toggle-delivery"
        onClick={() => handleSelect('DELIVERY')}
        className={cn(
          'flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-150 select-none min-h-[48px]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'active:scale-[0.98]',
          activeType === 'DELIVERY'
            ? 'bg-primary text-primary-foreground font-semibold shadow-md'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
        )}
      >
        <Truck className="h-4 w-4" />
        <span>Delivery</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={activeType === 'PICKUP'}
        data-testid="toggle-pickup"
        onClick={() => handleSelect('PICKUP')}
        className={cn(
          'flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-150 select-none min-h-[48px]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'active:scale-[0.98]',
          activeType === 'PICKUP'
            ? 'bg-primary text-primary-foreground font-semibold shadow-md'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
        )}
      >
        <Store className="h-4 w-4" />
        <span>Dispensary Pickup</span>
      </button>
    </div>
  );
}

