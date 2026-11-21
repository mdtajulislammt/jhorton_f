'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, Loader2, Plus } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { StrainBadge, strainTint } from '@/components/ui/strain-badge';
import { FallbackImage } from '@/components/ui/fallback-image';
import { categoryPhoto } from '@/lib/brand-photos';
import { cn, formatPct } from '@/lib/utils';
import type { ProductSummaryDto } from '@/types/api.generated';

export interface ProductCardProps {
  product: ProductSummaryDto;
  onAddToCart?: (productId: string) => void;
}

type AddState = 'idle' | 'adding' | 'added';

const quickBtn =
  'grid h-11 min-h-[44px] w-11 min-w-[44px] shrink-0 place-items-center rounded-full transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-70';

function trimNumber(value: string) {
  return String(parseFloat(value));
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { addToCart } = useCart();
  const [addState, setAddState] = React.useState<AddState>('idle');
  const fallback = categoryPhoto(product.category.slug);

  const isOwtletPrice = product.priceMode === 'OWTLET' && product.owtletPrice;
  const price = isOwtletPrice ? product.owtletPrice : product.fromPrice;
  const href = `/product/${product.slug}`;

  React.useEffect(() => {
    if (addState !== 'added') return;
    const t = setTimeout(() => setAddState('idle'), 2000);
    return () => clearTimeout(t);
  }, [addState]);

  const handleAdd = async () => {
    if (addState === 'adding') return;
    if (onAddToCart) {
      onAddToCart(product.id);
      setAddState('added');
      return;
    }
    setAddState('adding');
    try {
      await addToCart({ productId: product.id, source: 'catalog' });
      setAddState('added');
    } catch {
      setAddState('idle');
    }
  };

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-[18px] border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:border-secondary hover:shadow-xl motion-reduce:hover:translate-y-0"
      data-testid={`product-card-${product.slug}`}
    >
      {/* Photo */}
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className={cn('relative block aspect-square overflow-hidden', strainTint(product.strain?.type))}
      >
        <FallbackImage
          src={product.imageUrls?.[0]}
          fallback={fallback}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.07] motion-reduce:group-hover:scale-100"
        />
        {product.strain ? (
          <StrainBadge type={product.strain.type} className="absolute left-2.5 top-2.5" />
        ) : null}
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-2.5 sm:px-4 sm:pb-4 sm:pt-3.5">
        <span className="truncate text-[12.5px] font-semibold text-muted">{product.brand?.name ?? product.category.name}</span>

        <Link
          href={href}
          className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <h3 className="line-clamp-2 text-[14px] font-bold leading-[1.3] text-foreground sm:text-[15.5px]">
            {product.name}
          </h3>
        </Link>

        <div className="flex flex-wrap gap-1.5 font-mono text-[11px] text-muted-foreground sm:text-[11.5px]">
          {/* Strain chip only when the name doesn't already say it (design v3 keeps the card lean) */}
          {product.strain && !product.name.toLowerCase().includes(product.strain.name.toLowerCase()) ? (
            <span className="rounded-md bg-surface-muted px-[7px] py-0.5">{product.strain.name}</span>
          ) : null}
          {product.thcPercent ? (
            <span className="rounded-md bg-surface-muted px-[7px] py-0.5">THC {formatPct(product.thcPercent)}%</span>
          ) : null}
          {product.cbdPercent && parseFloat(product.cbdPercent) > 0 ? (
            <span className="rounded-md bg-surface-muted px-[7px] py-0.5">CBD {formatPct(product.cbdPercent)}%</span>
          ) : null}
          {product.weightGrams ? (
            <span className="rounded-md bg-surface-muted px-[7px] py-0.5">{trimNumber(product.weightGrams)}g</span>
          ) : null}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="flex flex-col">
            {price ? (
              <>
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-[0.08em]',
                    isOwtletPrice ? 'text-success' : 'text-muted'
                  )}
                >
                  {isOwtletPrice ? 'Owtlet Price' : 'From'}
                </span>
                <span className="font-mono text-base font-bold tabular-nums text-foreground sm:text-[19px]">${price}</span>
              </>
            ) : (
              <Link href={href} className="text-sm font-semibold text-muted-foreground underline-offset-4 hover:underline">
                See store prices
              </Link>
            )}
          </div>

          {isOwtletPrice ? (
            <button
              type="button"
              onClick={handleAdd}
              disabled={addState === 'adding'}
              aria-label={addState === 'added' ? `${product.name} added to Cart` : `Add ${product.name} to Cart`}
              className={cn(
                quickBtn,
                addState === 'added' ? 'bg-primary text-primary-foreground' : 'bg-ink text-owtlet-mist hover:bg-ink/85'
              )}
            >
              {addState === 'adding' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : addState === 'added' ? (
                <Check className="h-4 w-4" strokeWidth={3} />
              ) : (
                <Plus className="h-4 w-4" strokeWidth={3} />
              )}
            </button>
          ) : (
            // Per-store products have no price until a store is chosen, so send the shopper to pick one.
            <Link href={href} aria-label={`Choose a store for ${product.name}`} className={cn(quickBtn, 'bg-ink text-owtlet-mist hover:bg-ink/85')}>
              <Plus className="h-4 w-4" strokeWidth={3} />
            </Link>
          )}
        </div>

        <div className="mt-1 flex items-center gap-1.5 border-t border-dashed border-border pt-2.5 text-xs text-muted-foreground">
          <span
            className={cn('h-1.5 w-1.5 rounded-full', product.availableAtCount > 0 ? 'bg-success' : 'bg-muted')}
            aria-hidden="true"
          />
          {product.availableAtCount > 0
            ? `Available at ${product.availableAtCount} store${product.availableAtCount > 1 ? 's' : ''} near you`
            : 'Check availability near you'}
        </div>
      </div>
    </article>
  );
}
