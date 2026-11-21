'use client';

import * as React from 'react';
import { StoreAvailabilityDto } from '@/types/api.generated';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Loader2, MapPin, ShoppingBag, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StoreAvailabilityListProps {
  productSlug: string;
  initialAvailability: StoreAvailabilityDto[];
  priceMode: 'OWTLET' | 'PER_STORE';
  owtletPrice?: string | null;
  /** Controlled selection. When omitted the list keeps its own selection. */
  selectedDispensaryId?: string | null;
  onSelectStore?: (dispensaryId: string) => void;
}

function Chip({ tone = 'neutral', children }: { tone?: 'neutral' | 'good' | 'bad'; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        tone === 'good' && 'bg-success/15 text-success',
        tone === 'bad' && 'bg-danger/10 text-danger',
        tone === 'neutral' && 'bg-surface-muted text-foreground'
      )}
    >
      {children}
    </span>
  );
}

export function StoreAvailabilityList({
  productSlug,
  initialAvailability,
  priceMode,
  selectedDispensaryId,
  onSelectStore,
}: StoreAvailabilityListProps) {
  const [zipCode, setZipCode] = React.useState('');
  const [activeZip, setActiveZip] = React.useState<string | null>(null);
  const [zipError, setZipError] = React.useState<string | null>(null);
  const [availability, setAvailability] = React.useState<StoreAvailabilityDto[]>(initialAvailability);
  const [isLoading, setIsLoading] = React.useState(false);
  const [localSelected, setLocalSelected] = React.useState<string | null>(
    initialAvailability.find((a) => a.inStock)?.dispensaryId || null
  );
  const selectedId = selectedDispensaryId !== undefined ? selectedDispensaryId : localSelected;

  const handleZipCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanZip = zipCode.trim();
    if (!/^\d{5}$/.test(cleanZip)) {
      setZipError('Please enter a valid 5-digit New York ZIP code.');
      return;
    }

    setIsLoading(true);
    setZipError(null);
    try {
      const res = await fetch(`/api/products/${productSlug}?zip=${cleanZip}`);
      const data = await res.json();
      if (data.success && data.data?.availability) {
        setAvailability(data.data.availability);
        setActiveZip(cleanZip);
      } else {
        setZipError(data.error?.message ?? 'We couldn’t check that ZIP. Please try again.');
      }
    } catch {
      setZipError('We couldn’t check that ZIP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const select = (id: string) => {
    setLocalSelected(id);
    onSelectStore?.(id);
  };

  const inStockStores = availability.filter((a) => a.inStock);
  const outOfStockStores = availability.filter((a) => !a.inStock);
  const alternativeInStock = outOfStockStores.length > 0 && inStockStores.length > 0 ? inStockStores[0] : null;

  return (
    <section className="space-y-5" aria-labelledby="availability-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="availability-heading" className="font-heading text-2xl tracking-tight text-foreground sm:text-3xl">
            Partner Dispensary Availability
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {priceMode === 'OWTLET'
              ? 'Standardized Owtlet Price guaranteed across all licensed partner dispensaries.'
              : 'Prices and inventory vary by licensed dispensary location.'}
          </p>
        </div>

        {/* ZIP check */}
        <form onSubmit={handleZipCheck} className="flex w-full gap-2 sm:w-auto" noValidate>
          <label htmlFor="availability-zip" className="sr-only">
            Delivery ZIP code
          </label>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 focus-within:border-foreground/40 sm:w-64">
            <MapPin className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            <input
              id="availability-zip"
              type="text"
              inputMode="numeric"
              placeholder="Enter 5-digit NY ZIP"
              value={zipCode}
              onChange={(e) => {
                setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5));
                setZipError(null);
              }}
              aria-invalid={!!zipError}
              aria-describedby={zipError ? 'availability-zip-error' : undefined}
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
              maxLength={5}
            />
          </div>
          <Button type="submit" variant="ink" disabled={isLoading || zipCode.length !== 5} className="h-11 min-h-[44px] px-5 font-bold">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Checking..." /> : 'Check Delivery ZIP'}
          </Button>
        </form>
      </div>

      {zipError ? (
        <p id="availability-zip-error" role="alert" className="text-sm text-danger">
          {zipError}
        </p>
      ) : null}

      {activeZip ? (
        <div className="flex items-center justify-between rounded-2xl bg-surface-muted px-4 py-2.5 text-xs text-muted-foreground">
          <span>
            Showing delivery eligibility for NY ZIP <strong className="font-mono text-foreground">{activeZip}</strong>
          </span>
          <button
            type="button"
            onClick={() => {
              setActiveZip(null);
              setZipCode('');
              setAvailability(initialAvailability);
            }}
            className="min-h-[32px] rounded-sm font-bold text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Clear ZIP
          </button>
        </div>
      ) : null}

      {/* Store list */}
      <div className={cn('space-y-3', isLoading && 'opacity-60')} aria-busy={isLoading}>
        {availability.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted" aria-hidden="true" />
            <p className="text-sm font-semibold text-foreground">No dispensaries carry this product yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">Browse the catalog for similar products in stock near you.</p>
          </div>
        ) : (
          availability.map((store) => {
            const isSelected = selectedId === store.dispensaryId;

            return (
              <article
                key={store.dispensaryId}
                className={cn(
                  'rounded-2xl border bg-card p-4 transition-colors sm:p-5',
                  isSelected ? 'border-ink ring-1 ring-ink' : 'border-border hover:border-foreground/30',
                  !store.inStock && 'bg-surface-muted/60'
                )}
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">{store.dispensaryName}</h3>
                      {store.inStock ? (
                        <Chip tone="good">In Stock ({store.stockQty})</Chip>
                      ) : (
                        <Chip tone="bad">Out of Stock</Chip>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {store.addressLine1}, {store.city}, {store.state} {store.zip}
                      {store.distanceMiles !== null ? (
                        <span className="ml-1.5 font-mono font-semibold text-foreground">· {store.distanceMiles} mi away</span>
                      ) : null}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {store.offersPickup ? (
                        <Chip>
                          <ShoppingBag className="h-3 w-3" aria-hidden="true" /> Pickup Available
                        </Chip>
                      ) : null}
                      {store.offersDelivery ? (
                        <Chip tone={activeZip ? (store.deliversToZip ? 'good' : 'bad') : 'neutral'}>
                          <Truck className="h-3 w-3" aria-hidden="true" />
                          {activeZip
                            ? store.deliversToZip
                              ? `Delivers to ${activeZip}`
                              : `Does not deliver to ${activeZip}`
                            : 'Delivery Available'}
                        </Chip>
                      ) : null}
                    </div>

                    {!store.inStock && alternativeInStock ? (
                      <p className="mt-2 rounded-xl bg-warning/15 p-2.5 text-xs text-foreground">
                        {`Out of stock at ${store.dispensaryName} — available at `}
                        <strong>{alternativeInStock.dispensaryName}</strong>
                        {` (${alternativeInStock.offersPickup ? 'pickup' : 'delivery'}${
                          alternativeInStock.distanceMiles !== null ? ` · ${alternativeInStock.distanceMiles} mi` : ''
                        })`}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-border pt-3 sm:flex-col sm:items-end sm:justify-center sm:gap-2 sm:border-t-0 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <div className="font-mono text-xl font-bold tabular-nums text-foreground">{`$${store.price}`}</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                        {priceMode === 'OWTLET' ? 'Owtlet One Price' : 'Store Retail Price'}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={isSelected ? 'ink' : 'outline'}
                      disabled={!store.inStock}
                      onClick={() => select(store.dispensaryId)}
                      aria-pressed={isSelected}
                      className="min-h-[44px] px-4 font-bold"
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle2 className="mr-1.5 h-4 w-4" /> Selected Store
                        </>
                      ) : store.inStock ? (
                        'Select Store'
                      ) : (
                        'Unavailable'
                      )}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
