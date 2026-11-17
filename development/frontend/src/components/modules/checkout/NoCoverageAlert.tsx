'use client';

import * as React from 'react';
import { AlertTriangle, Store, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NoCoverageAlertProps {
  zip: string;
  onSwitchToPickup: () => void;
}

export function NoCoverageAlert({ zip, onSwitchToPickup }: NoCoverageAlertProps) {
  return (
    <div
      role="alert"
      data-testid="no-coverage-alert"
      className="p-5 rounded-2xl border border-destructive/40 bg-destructive/10 text-foreground space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1 text-sm space-y-1">
          <p className="font-semibold text-foreground">
            Delivery Unavailable for ZIP {zip || 'Entered'}
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Owtlet partner dispensaries currently deliver to Manhattan, Brooklyn, Queens,
            Westchester County, and Long Island.
          </p>
          <p className="text-xs text-foreground/80 font-medium pt-1">
            You can still order licensed cannabis for in-store pickup at any of our partner retail dispensaries!
          </p>
        </div>
      </div>

      <div className="pt-1 flex items-center gap-3">
        <Button
          type="button"
          onClick={onSwitchToPickup}
          data-testid="switch-to-pickup-btn"
          className="bg-primary text-primary-foreground hover:bg-primary-hover font-semibold text-xs px-4 py-2 h-9 rounded-xl active:scale-[0.98]"
        >
          <Store className="h-3.5 w-3.5 mr-1.5" />
          Switch to Dispensary Pickup
        </Button>
      </div>
    </div>
  );
}

