'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useCheckoutStore } from '@/stores/checkout.store';
import { Button } from '@/components/ui/button';
import { BRAND_PHOTOS } from '@/lib/brand-photos';
import { cn } from '@/lib/utils';

const AREAS = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island', 'Westchester', 'Long Island'];

type CheckState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'covered'; zip: string; area: string }
  | { kind: 'none'; zip: string }
  | { kind: 'error'; message: string };

/** "BROOKLYN" / "LONG_ISLAND" → "Brooklyn" / "Long Island" */
export function formatRegion(region?: string | null): string | null {
  if (!region) return null;
  return region
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Coverage band with a Delivery ZIP check against GET /api/dispensaries. Saves the ZIP for checkout. */
export function CoverageBand() {
  const setZip = useCheckoutStore((s) => s.setZip);
  const setFulfillmentType = useCheckoutStore((s) => s.setFulfillmentType);
  const [value, setValue] = React.useState('');
  const [state, setState] = React.useState<CheckState>({ kind: 'idle' });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const zip = value.trim();
    if (!/^\d{5}$/.test(zip)) {
      setState({ kind: 'error', message: 'Enter a 5-digit ZIP code, like 11211.' });
      return;
    }
    setState({ kind: 'checking' });
    try {
      // Envelope data is { zip, region, items } (docs/08 dispensaries contract)
      const res = await apiClient.get<{ zip: string; region: string | null; items: unknown[] }>(
        `/dispensaries?zip=${zip}&fulfillment=DELIVERY`
      );
      const stores = Array.isArray(res.data?.items) ? res.data.items.length : 0;
      const area = formatRegion(res.data?.region);
      setZip(zip, area);
      if (stores > 0) {
        setFulfillmentType('DELIVERY');
        setState({ kind: 'covered', zip, area: area ?? 'New York' });
      } else {
        setState({ kind: 'none', zip });
      }
    } catch (err: any) {
      if (err?.statusCode === 422 || err?.code === 'NO_COVERAGE') {
        setState({ kind: 'none', zip });
      } else {
        setState({ kind: 'error', message: 'We could not check that ZIP right now. Try again in a moment.' });
      }
    }
  };

  return (
    <section id="check-zip" className="dark relative isolate scroll-mt-28 overflow-hidden bg-background text-foreground">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BRAND_PHOTOS.plantsCanopy} alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-45" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-owtlet-ink from-25% via-owtlet-ink/80 to-owtlet-ink/60" />

      <div className="mx-auto grid max-w-content items-center gap-10 px-4 py-14 sm:px-7 lg:grid-cols-[1.1fr_1fr] lg:py-14">
        <div>
          <h2 className="font-heading text-[clamp(26px,3.4vw,40px)] leading-[1.04] tracking-[-0.01em] text-balance">
            Delivered across New York City and Long Island.
          </h2>
          <p className="mt-3 max-w-[48ch] text-[15px] text-muted-foreground">
            Owtlet works with licensed dispensaries in every area we serve. Check your ZIP to see delivery and
            pickup options.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {AREAS.map((area) => (
              <li key={area} className="rounded-full border border-border px-3.5 py-1.5 text-[13.5px] font-semibold">
                {area}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3 rounded-[20px] border border-border bg-card p-[22px]">
          <label htmlFor="coverage-zip" className="text-sm font-bold">
            Delivery ZIP
          </label>
          <div className="flex gap-2">
            <input
              id="coverage-zip"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={5}
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
              placeholder="11211"
              aria-describedby="coverage-zip-msg"
              aria-invalid={state.kind === 'error' || undefined}
              className="min-h-[44px] min-w-0 flex-1 rounded-xl border-[1.5px] border-border bg-background px-3.5 font-mono text-base text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
            />
            <Button type="submit" className="min-h-[44px] font-bold" disabled={state.kind === 'checking'}>
              {state.kind === 'checking' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Check Delivery ZIP
            </Button>
          </div>
          <p
            id="coverage-zip-msg"
            aria-live="polite"
            className={cn(
              'min-h-[20px] text-sm',
              state.kind === 'covered' && 'text-primary',
              (state.kind === 'none' || state.kind === 'error') && 'text-accent',
              (state.kind === 'idle' || state.kind === 'checking') && 'text-muted-foreground'
            )}
          >
            {state.kind === 'idle' && 'Example: 10001 is covered, 13202 is not.'}
            {state.kind === 'checking' && 'Checking partner stores…'}
            {state.kind === 'covered' &&
              `Good news: delivery and pickup are available in ${state.zip} (${state.area}).`}
            {state.kind === 'none' &&
              `We don't deliver to ${state.zip} yet. We currently serve Manhattan, Queens, Brooklyn, Westchester & Long Island.`}
            {state.kind === 'error' && state.message}
          </p>
        </form>
      </div>
    </section>
  );
}
