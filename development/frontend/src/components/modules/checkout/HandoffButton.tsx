'use strict';
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export interface HandoffButtonProps {
  subOrderId: string;
  orderId: string;
  dispensaryName: string;
  handoffChannel: string;
  platform?: string;
  initialHandoffUrl?: string | null;
  status: string;
  className?: string;
}

/**
 * HandoffButton
 *
 * Direct full-page navigation to /api/checkout/handoff/redirect?orderId=${orderId}
 * Displays platform badge, zero payment policy, and loading state.
 */
export function HandoffButton({
  subOrderId,
  orderId,
  dispensaryName,
  handoffChannel,
  platform,
  status: initialStatus,
  className = '',
}: HandoffButtonProps) {
  const [loading, setLoading] = useState(false);

  const isConfirmed = initialStatus === 'CONFIRMED';
  const isHandedOff = initialStatus === 'HANDED_OFF';

  const displayPlatform = platform || handoffChannel || 'Partner Checkout';

  const handleHandoff = () => {
    setLoading(true);
    if (typeof window !== 'undefined') {
      window.location.assign(`/api/checkout/handoff/redirect?orderId=${encodeURIComponent(orderId)}`);
    }
  };

  return (
    <div
      data-testid={`handoff-container-${subOrderId}`}
      className={`rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-col space-y-3.5 shadow-sm ${className}`}
    >
      {/* Header: Dispensary Name & Status Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="font-heading text-sm font-semibold text-foreground">
            {dispensaryName}
          </span>
          <Badge
            variant="outline"
            className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 border-border bg-secondary/50 text-muted-foreground"
          >
            {displayPlatform}
          </Badge>
        </div>

        {isConfirmed ? (
          <Badge
            variant="default"
            className="bg-primary/20 text-primary border-primary/30 text-[11px] font-medium flex items-center gap-1"
          >
            <CheckCircle2 className="h-3 w-3" />
            Order Confirmed
          </Badge>
        ) : isHandedOff ? (
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary border border-primary/20 text-[11px] font-medium flex items-center gap-1"
          >
            <CheckCircle2 className="h-3 w-3" />
            Transferred to Store
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-muted-foreground border-border text-[11px]"
          >
            Ready for Handoff
          </Badge>
        )}
      </div>

      {/* Compliance / Zero Payment Disclaimer */}
      <div
        data-testid="compliance-notice"
        className="flex items-start gap-2.5 rounded-xl bg-secondary/40 border border-border/60 p-3 text-xs text-muted-foreground leading-relaxed"
      >
        <ShieldCheck className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-foreground text-[11px]">
            Zero ID &amp; Zero Payment Policy
          </p>
          <p className="text-[11px]">
            Physical 21+ photo ID verification and payment occur directly with{' '}
            <strong className="text-foreground font-semibold">{dispensaryName}</strong>.
            Owtlet never collects government ID or cannabis payments.
          </p>
        </div>
      </div>

      {/* Action Button */}
      {isConfirmed ? (
        <div className="text-xs text-muted-foreground text-center py-1">
          This sub-order has been finalized and confirmed by {dispensaryName}.
        </div>
      ) : (
        <Button
          data-testid={`handoff-button-${subOrderId}`}
          onClick={handleHandoff}
          disabled={loading}
          className={`w-full min-h-[44px] rounded-xl font-semibold text-xs tracking-wide transition-all active:scale-[0.98] ${
            isHandedOff
              ? 'bg-secondary text-foreground hover:bg-secondary/80 border border-border'
              : 'bg-primary text-primary-foreground hover:bg-primary-hover shadow'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting to {dispensaryName}...
            </>
          ) : isHandedOff ? (
            <>
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              Reopen {dispensaryName} Order Page
            </>
          ) : (
            <>
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              Continue to {dispensaryName} checkout
            </>
          )}
        </Button>
      )}
    </div>
  );
}
