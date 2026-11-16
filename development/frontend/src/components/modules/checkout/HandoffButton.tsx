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
  RefreshCw,
} from 'lucide-react';

export interface HandoffButtonProps {
  subOrderId: string;
  orderId: string;
  dispensaryName: string;
  handoffChannel: 'LEAFLY' | 'RETAILER_PAGE' | string;
  initialHandoffUrl?: string | null;
  status: string;
  onHandoffSuccess?: (url: string) => void;
  className?: string;
}

/**
 * HandoffButton
 *
 * Compliant checkout handoff trigger per sub-order (docs/08 §9, ADR-005, AC-HND-01, T-HND-01).
 * Routes the shopper to Leafly or the retailer's direct order page for final payment
 * and 21+ physical ID verification.
 */
export function HandoffButton({
  subOrderId,
  orderId,
  dispensaryName,
  handoffChannel,
  initialHandoffUrl = null,
  status: initialStatus,
  onHandoffSuccess,
  className = '',
}: HandoffButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentHandoffUrl, setCurrentHandoffUrl] = useState<string | null>(initialHandoffUrl);
  const [currentStatus, setCurrentStatus] = useState<string>(initialStatus);

  const isHandedOff = currentStatus === 'HANDED_OFF';
  const isConfirmed = currentStatus === 'CONFIRMED';
  const isLeafly = handoffChannel === 'LEAFLY';

  const handleHandoff = async () => {
    // If already handed off and we have the URL cached, open directly
    if (isHandedOff && currentHandoffUrl) {
      if (typeof window !== 'undefined') {
        window.open(currentHandoffUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout/handoff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          subOrderId,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message || 'Failed to initialize handoff');
      }

      const handoffItem = json.data?.handoffs?.find(
        (h: any) => h.subOrderId === subOrderId
      ) || json.data?.handoffs?.[0];

      if (!handoffItem || !handoffItem.url) {
        throw new Error('No handoff URL received from provider');
      }

      setCurrentHandoffUrl(handoffItem.url);
      setCurrentStatus('HANDED_OFF');
      onHandoffSuccess?.(handoffItem.url);

      if (typeof window !== 'undefined') {
        window.open(handoffItem.url, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to connect to dispensary. Please try again.');
    } finally {
      setLoading(false);
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
            {isLeafly ? 'Leafly Handoff' : 'Retailer Menu'}
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
            Zero ID & Zero Payment Policy
          </p>
          <p className="text-[11px]">
            Physical 21+ photo ID verification and payment occur directly with{' '}
            <strong className="text-foreground font-semibold">{dispensaryName}</strong>.
            Owtlet never collects government ID or cannabis payments.
          </p>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          data-testid="handoff-error"
          className="flex items-center justify-between rounded-xl bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={handleHandoff}
            className="flex items-center gap-1 text-[11px] font-medium underline hover:text-foreground ml-2"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

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
              : 'bg-primary text-primary-foreground hover:bg-owtlet-volt hover:text-owtlet-ink shadow'
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
              {isLeafly
                ? `Complete Order on Leafly (${dispensaryName})`
                : `Complete Order at ${dispensaryName}`}
            </>
          )}
        </Button>
      )}
    </div>
  );
}

