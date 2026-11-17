'use client';

import * as React from 'react';
import Link from 'next/link';
import { Minus, Plus, Tag, Trash2 } from 'lucide-react';
import { CartLineDto } from '@/server/cart/types';
import { FallbackImage } from '@/components/ui/fallback-image';
import { strainTint } from '@/components/ui/strain-badge';
import { categoryPhoto } from '@/lib/brand-photos';
import { cn } from '@/lib/utils';

interface CartLineProps {
  item: CartLineDto;
  onUpdateQuantity: (quantity: number) => Promise<any>;
  onRemove: () => Promise<any>;
  isUpdating?: boolean;
}

const stepperBtn =
  'grid h-10 w-10 place-items-center text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 active:scale-[0.98]';

export function CartLine({ item, onUpdateQuantity, onRemove, isUpdating = false }: CartLineProps) {
  const handleDecrement = () => {
    if (item.quantity <= 1) onRemove();
    else onUpdateQuantity(item.quantity - 1);
  };

  const handleIncrement = () => {
    if (item.quantity < 10) onUpdateQuantity(item.quantity + 1);
  };

  return (
    <div className="flex items-start gap-3 py-4 first:pt-0 last:pb-0 sm:gap-4">
      <Link
        href={`/product/${item.slug}`}
        tabIndex={-1}
        aria-hidden="true"
        className={cn('relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl sm:h-24 sm:w-24', strainTint(item.strain?.type))}
      >
        <FallbackImage
          src={item.imageUrl}
          fallback={categoryPhoto(item.category.slug)}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </Link>

      <div className="flex min-h-[80px] min-w-0 flex-1 flex-col justify-between sm:min-h-[96px]">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/product/${item.slug}`}
              className="line-clamp-2 rounded-sm text-sm font-bold leading-snug text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-base"
            >
              {item.name}
            </Link>
            <button
              type="button"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
              onClick={onRemove}
              disabled={isUpdating}
              aria-label={`Remove ${item.name} from cart`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <span className="rounded-md bg-surface-muted px-1.5 py-0.5">{item.category.name}</span>
            {item.strain ? (
              <span className="rounded-md bg-surface-muted px-1.5 py-0.5">
                {item.strain.name} ({item.strain.type})
              </span>
            ) : null}
            {item.channelBrand ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 font-body font-semibold text-accent">
                <Tag className="h-3 w-3" aria-hidden="true" />
                {item.channelBrand.name} Storefront
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-base font-bold tabular-nums text-foreground">${item.lineTotal}</span>
              {item.quantity > 1 ? (
                <span className="font-mono text-xs text-muted-foreground">(${item.unitPrice} each)</span>
              ) : null}
            </div>
            <span
              className={cn(
                'text-[10px] font-bold uppercase tracking-[0.08em]',
                item.priceMode === 'OWTLET' ? 'text-success' : 'text-muted'
              )}
            >
              {item.priceMode === 'OWTLET' ? 'Uniform Live Show Price' : 'Dispensary retail price'}
            </span>
          </div>

          <div className="flex items-center overflow-hidden rounded-full border border-border bg-card" role="group" aria-label={`Quantity for ${item.name}`}>
            <button type="button" className={stepperBtn} onClick={handleDecrement} disabled={isUpdating} aria-label="Decrease quantity">
              {item.quantity <= 1 ? <Trash2 className="h-3.5 w-3.5 text-danger" /> : <Minus className="h-3.5 w-3.5" />}
            </button>
            <span className="w-7 select-none text-center font-mono text-sm font-bold tabular-nums" aria-live="polite">
              {item.quantity}
            </span>
            <button
              type="button"
              className={stepperBtn}
              onClick={handleIncrement}
              disabled={isUpdating || item.quantity >= 10}
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
