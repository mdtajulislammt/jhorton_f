'use client';

import React, { useState, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, AlertCircle, ExternalLink, Lock, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function AgeGateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const destination = searchParams?.get('next') || searchParams?.get('redirect') || '/';

  const [isPending, startTransition] = useTransition();
  const [exitMode, setExitMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfirm21Plus = async () => {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const response = await fetch('/api/age-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirmed21Plus: true }),
        });

        const data = await response.json().catch(() => null);

        if (response.ok && data?.success) {
          // Attestation successful -> route to intended destination
          router.push(destination);
          router.refresh();
        } else {
          setErrorMessage(data?.error?.message || 'Verification failed. Please try again.');
        }
      } catch (err: any) {
        setErrorMessage('Network connection error. Please try again.');
      }
    });
  };

  const handleUnder21 = async () => {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        await fetch('/api/age-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirmed21Plus: false }),
        });
      } catch {
        // Continue to exit screen regardless
      }
      setExitMode(true);
    });
  };

  return (
    <div className="dark relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4 text-foreground selection:bg-primary selection:text-primary-foreground sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <p className="mb-6 font-heading text-3xl tracking-tight text-foreground">
        Owtlet<sup className="ml-0.5 text-sm text-primary">™</sup>
      </p>
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur-md sm:p-10">
        {/* Brand Icon Header */}
        <div className="flex justify-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
            {exitMode ? (
              <AlertCircle className="h-8 w-8 text-accent motion-safe:animate-pulse" />
            ) : (
              <ShieldCheck className="h-8 w-8 text-primary" />
            )}
          </div>
        </div>

        {exitMode ? (
          /* State 3: Exit Screen (Under 21) */
          <div className="text-center space-y-6">
            <div>
              <span className="inline-block text-xs font-semibold tracking-wider uppercase text-accent bg-accent/10 border border-accent/30 rounded-full px-3 py-1 mb-3">
                Age Requirement Notice
              </span>
              <h1 className="font-heading text-2xl sm:text-3xl text-foreground tracking-tight leading-tight text-balance">
                21+ Restricted Access
              </h1>
            </div>

            <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed">
              Under New York State adult-use cannabis regulations (Marihuana Regulation &amp; Taxation Act),
              you must be at least 21 years of age to view cannabis products, live broadcasts, and dispensary pricing.
            </p>

            <div className="p-4 rounded-xl bg-surface-muted border border-border text-xs text-muted-foreground text-left space-y-2">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Lock className="h-4 w-4 text-secondary-foreground" />
                <span>New York Office of Cannabis Management (OCM)</span>
              </div>
              <p>
                Adult-use retail dispensary regulations strictly prohibit minors from accessing regulated marketplace channels.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href="https://cannabis.ny.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-border text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] transition-colors"
              >
                <span>Visit NY State OCM</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExitMode(false)}
                className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                <span>Made a mistake? Try again</span>
              </Button>
            </div>
          </div>
        ) : (
          /* State 1: Verification Dialog / Prompt */
          <div className="text-center space-y-6">
            <div>
              <span className="inline-block text-xs font-semibold tracking-wider uppercase text-primary bg-primary/10 border border-primary/30 rounded-full px-3 py-1 mb-3">
                Adult-Use Cannabis (21+)
              </span>
              <h1 className="font-heading text-2xl sm:text-3xl text-foreground tracking-tight leading-tight text-balance">
                You must be 21+ to enter Owtlet.
              </h1>
            </div>

            <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed">
              Owtlet™ is New York&apos;s live shopping marketplace for adult-use craft cannabis.
              Please confirm your age to view curated live shows and dispensary storefronts.
            </p>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-accent/15 border border-accent/40 text-xs text-foreground text-left flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              {/* Primary Action Button (44px min touch target, Mint pill variant, active compression) */}
              <Button
                onClick={handleConfirm21Plus}
                disabled={isPending}
                size="lg"
                className="w-full min-h-[52px] text-base font-bold"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Verifying...</span>
                  </span>
                ) : (
                  <span>I&apos;m 21 or Older</span>
                )}
              </Button>

              {/* Secondary Action Button */}
              <Button
                onClick={handleUnder21}
                disabled={isPending}
                variant="outline"
                size="lg"
                className="w-full min-h-[48px] text-sm"
              >
                <span>I&apos;m Under 21</span>
              </Button>
            </div>

            {/* Signature Domain Copy (docs/domain-lexicon.md & docs/04-experience-spec.md) */}
            <div className="pt-4 border-t border-border text-xs text-muted-foreground space-y-1.5">
              <p>
                You&apos;ll complete your purchase and ID check with the licensed dispensary.
                Owtlet never takes payment for cannabis.
              </p>
              <p className="text-[11px] text-muted">
                By clicking &ldquo;I&apos;m 21 or Older&rdquo;, you attest under penalty of law that you are at least 21 years of age.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgeGatePage() {
  return (
    <Suspense
      fallback={
        <div className="dark flex min-h-screen items-center justify-center bg-background text-primary">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <AgeGateContent />
    </Suspense>
  );
}
