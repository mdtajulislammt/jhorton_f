'use client';

import * as React from 'react';
import { StoreAvailabilityDto } from '@/server/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MapPin, Truck, ShoppingBag, CheckCircle2, AlertCircle, Search } from 'lucide-react';

export interface StoreAvailabilityListProps {
  productSlug: string;
  initialAvailability: StoreAvailabilityDto[];
  priceMode: 'OWTLET' | 'PER_STORE';
  owtletPrice?: string | null;
  onSelectStore?: (dispensaryId: string) => void;
}

export function StoreAvailabilityList({
  productSlug,
  initialAvailability,
  priceMode,
  owtletPrice,
  onSelectStore,
}: StoreAvailabilityListProps) {
  const [zipCode, setZipCode] = React.useState('');
  const [activeZip, setActiveZip] = React.useState<string | null>(null);
  const [availability, setAvailability] = React.useState<StoreAvailabilityDto[]>(initialAvailability);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedDispensaryId, setSelectedDispensaryId] = React.useState<string | null>(
    initialAvailability.find((a) => a.inStock)?.dispensaryId || null
  );

  const handleZipCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanZip = zipCode.trim();
    if (!/^\d{5}$/.test(cleanZip)) {
      alert('Please enter a valid 5-digit New York ZIP code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/products/${productSlug}?zip=${cleanZip}`);
      const data = await res.json();
      if (data.success && data.data?.availability) {
        setAvailability(data.data.availability);
        setActiveZip(cleanZip);
      }
    } catch (err) {
      console.error('Failed to check ZIP code coverage:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const inStockStores = availability.filter((a) => a.inStock);
  const outOfStockStores = availability.filter((a) => !a.inStock);

  return (
    <div className="space-y-6">
      {/* Header and ZIP Checker */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div>
          <h3 className="font-heading text-lg font-normal text-foreground">
            Partner Dispensary Availability
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {priceMode === 'OWTLET'
              ? 'Standardized Owtlet Price guaranteed across all licensed partner dispensaries.'
              : 'Prices and inventory vary by licensed dispensary location.'}
          </p>
        </div>

        {/* ZIP Check Form */}
        <form onSubmit={handleZipCheck} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter 5-digit NY ZIP (e.g. 10001, 11201)..."
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              className="pl-10 h-11 text-sm bg-background"
              maxLength={5}
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            disabled={isLoading || zipCode.length !== 5}
            className="h-11 px-5 font-bold min-h-[44px]"
          >
            {isLoading ? 'Checking...' : 'Check Delivery ZIP'}
          </Button>
        </form>

        {activeZip && (
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>
              Checking delivery eligibility for NY ZIP <strong className="text-foreground">{activeZip}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveZip(null);
                setZipCode('');
                setAvailability(initialAvailability);
              }}
              className="text-primary underline"
            >
              Clear ZIP
            </button>
          </div>
        )}
      </div>

      {/* Store List */}
      <div className="space-y-3">
        {availability.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-foreground">No dispensaries found for this product.</p>
            <p className="text-xs text-muted-foreground mt-1">Please try another cannabis category.</p>
          </div>
        ) : (
          availability.map((store) => {
            const isSelected = selectedDispensaryId === store.dispensaryId;
            const alternativeInStock = outOfStockStores.length > 0 && inStockStores.length > 0
              ? inStockStores[0]
              : null;

            return (
              <Card
                key={store.dispensaryId}
                className={`relative p-4 sm:p-5 transition-all ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Store Details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading text-base font-normal text-foreground">
                        {store.dispensaryName}
                      </h4>
                      {store.inStock ? (
                        <Badge variant="success" className="text-[10px] py-0">
                          In Stock ({store.stockQty})
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px] py-0">
                          Out of Stock
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {store.addressLine1}, {store.city}, {store.state} {store.zip}
                      {store.distanceMiles !== null && (
                        <span className="font-semibold text-foreground ml-1.5">
                          · {store.distanceMiles} mi away
                        </span>
                      )}
                    </p>

                    {/* Fulfillment Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {store.offersPickup && (
                        <span className="inline-flex items-center text-[11px] font-medium text-owtlet-ink bg-owtlet-sage/40 rounded px-2 py-0.5">
                          <ShoppingBag className="mr-1 h-3 w-3" /> Pickup Available
                        </span>
                      )}

                      {store.offersDelivery && (
                        <span
                          className={`inline-flex items-center text-[11px] font-medium rounded px-2 py-0.5 ${
                            activeZip
                              ? store.deliversToZip
                                ? 'text-green-800 bg-green-100 font-bold'
                                : 'text-red-700 bg-red-50'
                              : 'text-owtlet-ink bg-owtlet-sage/40'
                          }`}
                        >
                          <Truck className="mr-1 h-3 w-3" />
                          {activeZip
                            ? store.deliversToZip
                              ? `Delivers to ${activeZip}`
                              : `Does not deliver to ${activeZip}`
                            : 'Delivery Available'}
                        </span>
                      )}
                    </div>

                    {/* Out-of-stock suggestion note */}
                    {!store.inStock && alternativeInStock && (
                      <p className="text-xs text-amber-700 bg-amber-50 rounded p-2 mt-2">
                        {`Out of stock at ${store.dispensaryName} — available at `}
                        <strong>{alternativeInStock.dispensaryName}</strong>
                        {` (${alternativeInStock.offersPickup ? 'pickup' : 'delivery'}${
                          alternativeInStock.distanceMiles !== null
                            ? ` · ${alternativeInStock.distanceMiles} mi`
                            : ''
                        })`}
                      </p>
                    )}
                  </div>

                  {/* Price & Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
                    <div className="text-left sm:text-right">
                      <div className="font-heading text-xl font-normal text-foreground">
                        {`$${store.price}`}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {priceMode === 'OWTLET' ? 'Owtlet One Price' : 'Store Retail Price'}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={isSelected ? 'default' : 'secondary'}
                      disabled={!store.inStock}
                      onClick={() => {
                        setSelectedDispensaryId(store.dispensaryId);
                        if (onSelectStore) {
                          onSelectStore(store.dispensaryId);
                        }
                      }}
                      className="mt-2 min-h-[44px] font-bold active:scale-[0.98]"
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
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
