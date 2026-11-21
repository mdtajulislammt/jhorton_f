'use client';

import * as React from 'react';
import { ShoppingBag, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CheckoutSummaryProps {
  total: string;
  subOrderCount: number;
  itemCount: number;
  onPlaceOrder: () => void;
  isPlacingOrder: boolean;
  isLoadingPreview: boolean;
  hasUnfulfillableItems: boolean;
  isNoCoverage: boolean;
  isFormValid: boolean;
  validationMessage?: string | null;
}

export function CheckoutSummary({
  total,
  subOrderCount,
  itemCount,
  onPlaceOrder,
  isPlacingOrder,
  isLoadingPreview,
  hasUnfulfillableItems,
  isNoCoverage,
  isFormValid,
  validationMessage,
}: CheckoutSummaryProps) {
  const isButtonDisabled =
    isPlacingOrder ||
    isLoadingPreview ||
    hasUnfulfillableItems ||
    isNoCoverage ||
    !isFormValid;

  return (
    <div
      className="p-5 rounded-2xl border border-border bg-card text-foreground shadow-sm space-y-4"
      data-testid="checkout-summary"
    >
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h3 className="font-heading text-sm font-semibold text-foreground">
          Order Summary
        </h3>
        <span className="text-xs text-muted-foreground">
          {itemCount} item{itemCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2.5 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Dispensary Fulfillment</span>
          <span className="font-medium text-foreground">
            {subOrderCount > 0
              ? `${subOrderCount} dispensary order${subOrderCount > 1 ? 's' : ''}`
              : 'Calculating...'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Cannabis Subtotal</span>
          <span className="font-mono font-medium text-foreground">
            ${parseFloat(total || '0').toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Payment & Taxes</span>
          <span className="text-muted-foreground text-[11px] text-right">
            Paid to dispensary at handoff
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-border flex items-baseline justify-between">
        <div>
          <span className="font-heading text-base font-semibold text-foreground">
            Estimated Total
          </span>
          <p className="text-[10px] text-muted-foreground">
            Final payment made to dispensary partner
          </p>
        </div>
        <span className="font-heading text-xl font-bold text-foreground font-mono">
          ${parseFloat(total || '0').toFixed(2)}
        </span>
      </div>

      {/* Validation or status hint */}
      {validationMessage && !hasUnfulfillableItems && !isNoCoverage && (
        <p role="status" className="rounded-lg bg-warning/15 px-2.5 py-1.5 text-[11px] font-semibold text-foreground">
          {validationMessage}
        </p>
      )}

      {/* Place Order CTA */}
      <Button
        type="button"
        disabled={isButtonDisabled}
        onClick={onPlaceOrder}
        data-testid="place-order-btn"
        className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover font-semibold text-sm shadow-md active:scale-[0.98] transition-all"
      >
        {isPlacingOrder ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating Order...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>Continue to partner checkout</span>
            <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </Button>

      {/* Regulatory / Zero-Payment Notice */}
      <div className="pt-2 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
        <p>
          Owtlet does not accept or process payment for cannabis. You will pay the licensed
          dispensary directly via cash, debit, or their approved checkout portal.
        </p>
      </div>
    </div>
  );
}

