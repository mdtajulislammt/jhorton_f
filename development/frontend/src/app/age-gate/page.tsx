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
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-owtlet-ink text-owtlet-mist selection:bg-owtlet-mint selection:text-owtlet-ink">
      <div className="w-full max-w-lg p-6 sm:p-10 rounded-3xl bg-white/[0.04] border border-owtlet-sage/20 backdrop-blur-md shadow-2xl transition-all duration-300">
        {/* Brand Icon Header */}
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-owtlet-mint/15 border border-owtlet-mint/30 flex items-center justify-center text-owtlet-mint shadow-inner">
            {exitMode ? (
              <AlertCircle className="h-8 w-8 text-owtlet-ember animate-pulse" />
            ) : (
              <ShieldCheck className="h-8 w-8 text-owtlet-mint" />
            )}
          </div>
        </div>

        {exitMode ? (
          /* State 3: Exit Screen (Under 21) */
          <div className="text-center space-y-6">
            <div>
              <span className="inline-block text-xs font-semibold tracking-wider uppercase text-owtlet-ember bg-owtlet-ember/10 border border-owtlet-ember/30 rounded-full px-3 py-1 mb-3">
                Age Requirement Notice
              </span>
              <h1 className="font-heading text-2xl sm:text-3xl text-owtlet-mint tracking-tight leading-tight">
                21+ Restricted Access
              </h1>
            </div>

            <p className="font-body text-sm sm:text-base text-owtlet-mist/85 leading-relaxed">
              Under New York State adult-use cannabis regulations (Marihuana Regulation &amp; Taxation Act),
              you must be at least 21 years of age to view cannabis products, live broadcasts, and dispensary pricing.
            </p>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-owtlet-mist/70 text-left space-y-2">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Lock className="h-4 w-4 text-owtlet-sage" />
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
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-owtlet-sage/30 text-xs font-medium text-owtlet-sage hover:text-owtlet-mint hover:border-owtlet-mint transition-colors"
              >
                <span>Visit NY State OCM</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExitMode(false)}
                className="w-full sm:w-auto text-xs text-owtlet-mist/60 hover:text-white"
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
              <span className="inline-block text-xs font-semibold tracking-wider uppercase text-owtlet-mint bg-owtlet-mint/10 border border-owtlet-mint/30 rounded-full px-3 py-1 mb-3">
                Adult-Use Cannabis (21+)
              </span>
              <h1 className="font-heading text-2xl sm:text-3xl text-owtlet-mint tracking-tight leading-tight">
                You must be 21+ to enter Owtlet.
              </h1>
            </div>

            <p className="font-body text-sm sm:text-base text-owtlet-mist/85 leading-relaxed">
              Owtlet™ is New York&apos;s live shopping marketplace for adult-use craft cannabis.
              Please confirm your age to view curated live shows and dispensary storefronts.
            </p>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-owtlet-ember/15 border border-owtlet-ember/40 text-xs text-owtlet-ember text-left flex items-center gap-2">
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
                className="w-full bg-owtlet-mint text-owtlet-ink hover:bg-owtlet-volt active:scale-[0.98] font-semibold text-base py-6 rounded-full shadow-lg shadow-owtlet-mint/10 transition-all"
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
                className="w-full border-white/20 text-white/90 hover:bg-white/10 hover:text-white active:scale-[0.98] text-sm py-5 rounded-full transition-all"
              >
                <span>I&apos;m Under 21</span>
              </Button>
            </div>

            {/* Signature Domain Copy (docs/domain-lexicon.md & docs/04-experience-spec.md) */}
            <div className="pt-4 border-t border-white/10 text-xs text-owtlet-mist/60 space-y-1.5">
              <p>
                You&apos;ll complete your purchase and ID check with the licensed dispensary.
                Owtlet never takes payment for cannabis.
              </p>
              <p className="text-[11px] text-owtlet-mist/40">
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
        <div className="flex min-h-screen items-center justify-center bg-owtlet-ink text-owtlet-mint">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <AgeGateContent />
    </Suspense>
  );
}
