'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Check, Sparkles, AlertCircle } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { toast } from '@/stores/toast.store';
import { TerrificSource } from '@/lib/terrific';

export interface PinnedProductItem {
  productId: string;
  slug: string;
  name: string;
  terrificProductId?: string | null;
  owtletPrice: string;
  imageUrls?: string[];
  categoryName?: string | null;
  strainName?: string | null;
  sortOrder?: number;
}

export interface PinnedProductRailProps {
  products: PinnedProductItem[];
  liveShowId?: string;
  source?: TerrificSource;
  title?: string;
  className?: string;
}

export function PinnedProductRail({
  products = [],
  liveShowId,
  source = 'terrific_live',
  title = 'Featured in this Video',
  className = '',
}: PinnedProductRailProps) {
  const { addToCart } = useCart();
  const [addingId, setAddingId] = React.useState<string | null>(null);
  const [addedIds, setAddedIds] = React.useState<Set<string>>(new Set());

  const handleAddToCart = async (product: PinnedProductItem) => {
    try {
      setAddingId(product.productId);

      await addToCart({
        productId: product.productId,
        quantity: 1,
        source,
        liveShowId,
      });

      setAddedIds((prev) => new Set(prev).add(product.productId));
      toast.success(`${product.name} added to cart at exclusive show price!`);

      setTimeout(() => {
        setAddedIds((prev) => {
          const next = new Set(prev);
          next.delete(product.productId);
          return next;
        });
      }, 3000);
    } catch (err: any) {
      console.error('Failed to add pinned product to cart:', err);
      toast.error(err?.message || 'Failed to add product to cart.');
    } finally {
      setAddingId(null);
    }
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-2xl border border-border bg-card p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <h3 className="font-heading text-lg font-bold text-foreground">
            {title}
          </h3>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          {products.length} {products.length === 1 ? 'Item' : 'Items'} Available
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => {
          const isAdding = addingId === product.productId;
          const isAdded = addedIds.has(product.productId);
          const hasImage = product.imageUrls && product.imageUrls.length > 0;

          return (
            <div
              key={product.productId}
              className="flex flex-col rounded-xl border border-border/80 bg-background p-4 hover:border-primary/40 transition-all shadow-xs"
            >
              {/* Image & Badges */}
              <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                {hasImage ? (
                  <img
                    src={product.imageUrls![0]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
                )}

                <div className="absolute top-2 left-2">
                  <Badge className="bg-primary text-primary-foreground font-bold text-xs uppercase px-2 py-0.5">
                    ${product.owtletPrice}
                  </Badge>
                </div>
              </div>

              {/* Title & Category */}
              <div className="flex flex-1 flex-col">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mb-1">
                  {product.categoryName && <span>{product.categoryName}</span>}
                  {product.strainName && (
                    <>
                      <span>•</span>
                      <span>{product.strainName}</span>
                    </>
                  )}
                </div>

                <Link
                  href={`/product/${product.slug}`}
                  className="font-heading text-sm font-bold text-foreground hover:text-primary transition-colors line-clamp-1 mb-3"
                >
                  {product.name}
                </Link>

                <div className="mt-auto pt-2">
                  <Button
                    onClick={() => handleAddToCart(product)}
                    disabled={isAdding}
                    size="sm"
                    className={`w-full min-h-[44px] font-bold active:scale-[0.98] transition-all ${
                      isAdded
                        ? 'bg-success text-success-foreground hover:bg-success/90'
                        : 'bg-primary text-primary-foreground hover:bg-owtlet-volt'
                    }`}
                  >
                    {isAdding ? (
                      <span className="flex items-center gap-1.5">
                        <ShoppingBag className="h-4 w-4 animate-spin" />
                        Adding...
                      </span>
                    ) : isAdded ? (
                      <span className="flex items-center gap-1.5">
                        <Check className="h-4 w-4" />
                        Added to Cart!
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <ShoppingBag className="h-4 w-4" />
                        Tap to Cart · ${product.owtletPrice}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

