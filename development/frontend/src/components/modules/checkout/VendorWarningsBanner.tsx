'use client';

import * as React from 'react';
import { AlertTriangle, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartVendorWarningDto } from '@/types/api.generated';

interface VendorWarningsBannerProps {
  warnings: CartVendorWarningDto[];
  onRemoveItem: (productId: string) => void;
  onContinueWithout: () => void;
  isRemoving?: boolean;
}

export function VendorWarningsBanner({
  warnings,
  onRemoveItem,
  onContinueWithout,
  isRemoving = false,
}: VendorWarningsBannerProps) {
  if (warnings.length === 0) return null;

  return (
    <div
      className="p-4 rounded-2xl border border-warning/40 bg-warning/10 text-foreground space-y-3"
      data-testid="vendor-warnings-banner"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        <div>
          <h4 className="font-heading text-sm font-semibold text-foreground">
            {warnings.length} item{warnings.length > 1 ? 's' : ''} not available at this partner
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            The selected partner dispensary does not currently carry the following item
            {warnings.length > 1 ? 's' : ''} in stock. You can remove them or continue with the rest of your cart.
          </p>
        </div>
      </div>

      {/* Warning Items List */}
      <div className="space-y-2 pt-1">
        {warnings.map((w) => (
          <div
            key={w.cartItemId}
            className="flex items-center justify-between p-2.5 rounded-xl bg-background/60 border border-border text-xs"
          >
            <div>
              <span className="font-medium text-foreground">{w.productName}</span>
              {w.sku && (
                <span className="text-[11px] font-mono text-muted-foreground ml-2">
                  (SKU: {w.sku})
                </span>
              )}
              <span className="block text-[11px] text-warning mt-0.5">
                {w.reason === 'UNMAPPED' ? 'Not mapped for this vendor' : 'Temporarily out of stock'}
              </span>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemoveItem(w.productId)}
              disabled={isRemoving}
              className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              data-testid={`remove-unmapped-btn-${w.productId}`}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Remove item
            </Button>
          </div>
        ))}
      </div>

      {/* Continue Without CTA */}
      <div className="flex justify-end pt-1">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onContinueWithout}
          className="text-xs h-8 rounded-lg"
          data-testid="continue-without-btn"
        >
          <span>Continue without unavailable items</span>
          <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}

