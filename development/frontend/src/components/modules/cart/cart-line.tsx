'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, Tag, Cannabis } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CartLineDto } from '@/server/cart/types';

interface CartLineProps {
  item: CartLineDto;
  onUpdateQuantity: (quantity: number) => Promise<any>;
  onRemove: () => Promise<any>;
  isUpdating?: boolean;
}

export function CartLine({
  item,
  onUpdateQuantity,
  onRemove,
  isUpdating = false,
}: CartLineProps) {
  const handleDecrement = () => {
    if (item.quantity <= 1) {
      onRemove();
    } else {
      onUpdateQuantity(item.quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (item.quantity < 10) {
      onUpdateQuantity(item.quantity + 1);
    }
  };

  return (
    <div className="flex gap-3 sm:gap-4 py-4 border-b border-border/60 last:border-0 items-start">
      {/* Product Thumbnail */}
      <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 80px, 96px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-owtlet-sage/20 text-owtlet-ink">
            <Cannabis className="h-8 w-8 text-owtlet-ink/60" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between min-h-[80px] sm:min-h-[96px]">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/product/${item.slug}`}
              className="font-medium text-sm sm:text-base text-foreground hover:text-primary transition-colors line-clamp-1"
            >
              {item.name}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 active:scale-[0.98]"
              onClick={onRemove}
              disabled={isUpdating}
              aria-label={`Remove ${item.name} from cart`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Strain & Category Tags */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-[11px] py-0 px-1.5 text-muted-foreground">
              {item.category.name}
            </Badge>
            {item.strain && (
              <Badge variant="secondary" className="text-[11px] py-0 px-1.5 font-normal">
                {item.strain.name} ({item.strain.type})
              </Badge>
            )}
            {item.channelBrand && (
              <Badge variant="outline" className="text-[11px] py-0 px-1.5 border-accent/40 text-accent font-medium">
                <Tag className="mr-1 h-3 w-3" />
                {item.channelBrand.name} Storefront
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing & Stepper */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="font-heading text-sm sm:text-base text-foreground font-bold">
                ${item.lineTotal}
              </span>
              {item.quantity > 1 && (
                <span className="text-xs text-muted-foreground">
                  (${item.unitPrice} each)
                </span>
              )}
            </div>
            {item.priceMode === 'OWTLET' ? (
              <span className="text-[10px] sm:text-xs text-primary font-semibold">
                Uniform Live Show Price
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">
                Dispensary retail price
              </span>
            )}
          </div>

          {/* Stepper with 44px touch targets */}
          <div className="flex items-center rounded-lg border border-border bg-background shadow-sm">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 sm:h-9 sm:w-9 rounded-r-none text-foreground hover:bg-muted active:scale-[0.98]"
              onClick={handleDecrement}
              disabled={isUpdating}
              aria-label="Decrease quantity"
            >
              {item.quantity <= 1 ? (
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              ) : (
                <Minus className="h-3.5 w-3.5" />
              )}
            </Button>
            <span
              className="w-8 text-center text-xs sm:text-sm font-semibold select-none"
              aria-live="polite"
            >
              {item.quantity}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 sm:h-9 sm:w-9 rounded-l-none text-foreground hover:bg-muted active:scale-[0.98]"
              onClick={handleIncrement}
              disabled={isUpdating || item.quantity >= 10}
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
