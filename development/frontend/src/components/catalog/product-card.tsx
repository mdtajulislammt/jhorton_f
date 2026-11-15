'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ProductSummaryDto } from '@/server/products';
import { Sparkles, MapPin, Zap } from 'lucide-react';

export interface ProductCardProps {
  product: ProductSummaryDto;
  onAddToCart?: (productId: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const isOwtletPrice = product.priceMode === 'OWTLET' && product.owtletPrice;

  // Strain type badge variant
  const getStrainVariant = (type?: string) => {
    switch (type) {
      case 'SATIVA':
        return 'warning';
      case 'INDICA':
        return 'secondary';
      case 'HYBRID':
        return 'default';
      case 'CBD':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Card
      interactive
      className="group flex flex-col justify-between overflow-hidden border-border bg-card transition-all duration-200 hover:border-primary/60 hover:shadow-lg"
      data-testid={`product-card-${product.slug}`}
    >
      <div>
        {/* Product Media Container */}
        <div className="relative aspect-square w-full overflow-hidden bg-owtlet-sage/20">
          {product.imageUrls && product.imageUrls.length > 0 ? (
            <img
              src={product.imageUrls[0]}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                // Fallback icon container on image error
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = parent.querySelector('[data-testid="fallback-icon"]');
                  if (fallback) fallback.classList.remove('hidden');
                }
              }}
            />
          ) : null}

          {/* Fallback art if image not loaded */}
          <div
            data-testid="fallback-icon"
            className={`absolute inset-0 flex flex-col items-center justify-center p-4 text-muted-foreground ${
              product.imageUrls && product.imageUrls.length > 0 ? 'hidden' : ''
            }`}
          >
            <Sparkles className="h-12 w-12 text-primary/40 mb-2" />
            <span className="text-xs font-medium uppercase tracking-wider text-owtlet-ink/60">
              {product.category.name}
            </span>
          </div>

          {/* Live Show / Owtlet Single Price Ribbon */}
          {isOwtletPrice ? (
            <div className="absolute top-2.5 left-2.5">
              <Badge variant="live" className="shadow-md text-[11px] py-0.5 px-2">
                <Zap className="mr-1 h-3 w-3 fill-white" />
                Owtlet Price
              </Badge>
            </div>
          ) : null}

          {/* Strain Tag */}
          {product.strain ? (
            <div className="absolute top-2.5 right-2.5">
              <Badge variant={getStrainVariant(product.strain.type)} className="text-[10px] uppercase font-bold tracking-wider">
                {product.strain.name} · {product.strain.type}
              </Badge>
            </div>
          ) : null}
        </div>

        {/* Card Content */}
        <CardContent className="p-4 sm:p-5">
          {/* Brand & Category Breadcrumb */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span className="font-medium text-owtlet-ink/70">
              {product.brand?.name || 'Craft Partner'}
            </span>
            <span className="text-owtlet-ink/50 uppercase tracking-wider text-[10px]">
              {product.category.name}
            </span>
          </div>

          {/* Product Name */}
          <Link
            href={`/product/${product.slug}`}
            className="group-hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            <h3 className="font-heading text-base sm:text-lg font-normal leading-snug tracking-tight text-foreground line-clamp-2 min-h-[2.5rem]">
              {product.name}
            </h3>
          </Link>

          {/* Potency & Weight Specs */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            {product.thcPercent ? (
              <span className="inline-flex items-center rounded bg-owtlet-sage/30 px-2 py-0.5 text-xs font-semibold text-owtlet-ink">
                THC {product.thcPercent}%
              </span>
            ) : null}
            {product.cbdPercent && parseFloat(product.cbdPercent) > 0 ? (
              <span className="inline-flex items-center rounded bg-owtlet-sage/30 px-2 py-0.5 text-xs font-semibold text-owtlet-ink">
                CBD {product.cbdPercent}%
              </span>
            ) : null}
            {product.weightGrams ? (
              <span className="inline-flex items-center rounded border border-border px-2 py-0.5 text-xs text-muted-foreground">
                {product.weightGrams}g
              </span>
            ) : null}
          </div>

          {/* Store Availability Counter */}
          <div className="mt-3 flex items-center text-xs text-muted-foreground">
            <MapPin className="mr-1 h-3.5 w-3.5 text-primary" />
            <span>
              {product.availableAtCount > 0
                ? `In stock at ${product.availableAtCount} partner store${product.availableAtCount > 1 ? 's' : ''}`
                : 'Check availability near you'}
            </span>
          </div>
        </CardContent>
      </div>

      {/* Card Footer with Pricing & Active CTA */}
      <CardFooter className="p-4 sm:p-5 pt-0 flex items-center justify-between border-t border-border/50 mt-3">
        {/* Pricing Display */}
        <div className="flex flex-col">
          {isOwtletPrice ? (
            <>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                One Show Price
              </span>
              <span className="font-heading text-xl font-normal text-foreground">
                {`$${product.owtletPrice}`}
              </span>
            </>
          ) : product.fromPrice ? (
            <>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                From
              </span>
              <span className="font-heading text-xl font-normal text-foreground">
                {`$${product.fromPrice}`}
              </span>
            </>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">
              See store prices
            </span>
          )}
        </div>

        {/* View / Add Action */}
        <Link href={`/product/${product.slug}`} className="min-h-[44px] flex items-center">
          <Button
            size="sm"
            variant="default"
            className="min-h-[44px] px-4 font-bold active:scale-[0.98]"
            onClick={(e) => {
              if (onAddToCart) {
                e.preventDefault();
                onAddToCart(product.id);
              }
            }}
          >
            View Options
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
