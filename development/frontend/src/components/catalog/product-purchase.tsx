'use client';

import * as React from 'react';
import { Check, Loader2, Minus, Plus, ShoppingBag, Store } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { StoreAvailabilityList } from './store-availability-list';
import { cn } from '@/lib/utils';
import type { StoreAvailabilityDto } from '@/server/products';

interface PurchaseContextValue {
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  availability: StoreAvailabilityDto[];
}

const PurchaseContext = React.createContext<PurchaseContextValue | null>(null);

function usePurchase() {
  const ctx = React.useContext(PurchaseContext);
  if (!ctx) throw new Error('usePurchase must be used inside <ProductPurchaseProvider>');
  return ctx;
}

/** Shares the shopper's chosen partner store between the buy box and the availability list. */
export function ProductPurchaseProvider({
  availability,
  children,
}: {
  availability: StoreAvailabilityDto[];
  children: React.ReactNode;
}) {
  const [selectedId, setSelectedId] = React.useState<string | null>(
    availability.find((a) => a.inStock)?.dispensaryId ?? null
  );
  const value = React.useMemo(() => ({ selectedId, setSelectedId, availability }), [selectedId, availability]);
  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
}

const MAX_QTY = 10;

export interface ProductBuyBoxProps {
  productId: string;
  productName: string;
  price: string | null;
  isOwtletPrice: boolean;
}

/** Price, quantity stepper and Add to Cart. Uses the existing cart API with the selected store as the preference. */
export function ProductBuyBox({ productId, productName, price, isOwtletPrice }: ProductBuyBoxProps) {
  const { selectedId, availability } = usePurchase();
  const { addToCart } = useCart();
  const [qty, setQty] = React.useState(1);
  const [state, setState] = React.useState<'idle' | 'adding' | 'added' | 'error'>('idle');

  const selected = availability.find((a) => a.dispensaryId === selectedId) ?? null;
  const anyInStock = availability.some((a) => a.inStock);
  const maxQty = selected ? Math.max(1, Math.min(MAX_QTY, selected.stockQty)) : MAX_QTY;
  const unitPrice = isOwtletPrice ? price : selected?.price ?? price;

  React.useEffect(() => setQty((q) => Math.min(q, maxQty)), [maxQty]);

  React.useEffect(() => {
    if (state !== 'added') return;
    const t = setTimeout(() => setState('idle'), 2200);
    return () => clearTimeout(t);
  }, [state]);

  const onAdd = async () => {
    if (state === 'adding') return;
    setState('adding');
    try {
      await addToCart({
        productId,
        quantity: qty,
        source: 'catalog',
        preferredDispensaryId: selected?.dispensaryId,
      });
      setState('added');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span
            className={cn(
              'text-[11px] font-bold uppercase tracking-[0.1em]',
              isOwtletPrice ? 'text-success' : 'text-muted'
            )}
          >
            {isOwtletPrice ? 'Owtlet Price · same at every partner store' : selected ? `Price at ${selected.dispensaryName}` : 'From'}
          </span>
          <div className="font-mono text-4xl font-bold tabular-nums text-foreground">
            {unitPrice ? `$${unitPrice}` : '—'}
          </div>
        </div>
        {selected ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Store className="h-3.5 w-3.5" aria-hidden="true" />
            Reserving at <strong className="text-foreground">{selected.dispensaryName}</strong>
          </p>
        ) : null}
      </div>

      <div className="flex gap-3">
        <div className="flex items-center rounded-full border border-border" role="group" aria-label="Quantity">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
            className="grid h-12 w-11 place-items-center rounded-l-full text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center font-mono text-base font-bold tabular-nums text-foreground" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            disabled={qty >= maxQty}
            aria-label="Increase quantity"
            className="grid h-12 w-11 place-items-center rounded-r-full text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <Button
          type="button"
          size="lg"
          variant={state === 'added' ? 'default' : 'ink'}
          onClick={onAdd}
          disabled={state === 'adding' || !anyInStock}
          className="h-12 flex-1 gap-2 font-bold"
          aria-label={state === 'added' ? `${productName} added to Cart` : `Add ${productName} to Cart`}
        >
          {state === 'adding' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : state === 'added' ? (
            <Check className="h-4 w-4" strokeWidth={3} />
          ) : (
            <ShoppingBag className="h-4 w-4" />
          )}
          {!anyInStock ? 'Out of stock' : state === 'added' ? 'Added to Cart' : 'Add to Cart'}
        </Button>
      </div>

      {state === 'error' ? (
        <p role="alert" className="text-sm text-danger">
          We couldn&apos;t add this to your cart. Please try again.
        </p>
      ) : null}
      {!anyInStock ? (
        <p className="text-sm text-muted-foreground">
          This product is out of stock at every partner store right now. Check back after the next restock.
        </p>
      ) : null}
    </div>
  );
}

/** Availability list wired to the shared store selection. */
export function ConnectedStoreAvailability(props: {
  productSlug: string;
  priceMode: 'OWTLET' | 'PER_STORE';
  owtletPrice?: string | null;
}) {
  const { selectedId, setSelectedId, availability } = usePurchase();
  return (
    <StoreAvailabilityList
      {...props}
      initialAvailability={availability}
      selectedDispensaryId={selectedId}
      onSelectStore={setSelectedId}
    />
  );
}
