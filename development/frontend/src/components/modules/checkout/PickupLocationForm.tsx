'use client';

import * as React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCheckoutStore } from '@/stores/checkout.store';

interface PickupLocationFormProps {
  className?: string;
}

export function PickupLocationForm({ className }: PickupLocationFormProps) {
  const { zip, setZip } = useCheckoutStore();

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 5);
    setZip(val);
  };

  return (
    <div className={className} data-testid="pickup-location-form">
      <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-foreground">
        <Navigation className="h-4 w-4 text-primary" />
        <span>Pickup Location (Sort by Proximity)</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="w-full sm:w-48">
          <Input
            id="pickup-zip"
            type="text"
            inputMode="numeric"
            maxLength={5}
            placeholder="10001"
            value={zip}
            onChange={handleZipChange}
            className="h-11 rounded-xl text-sm font-mono tracking-wider"
          />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Enter your current NY ZIP to show the nearest licensed partner dispensaries.
        </p>
      </div>
    </div>
  );
}

