'use client';

import * as React from 'react';
import { ProductSummaryDto } from '@/types/api.generated';
import { ProductCard } from '@/components/catalog/product-card';
import { useCart } from '@/hooks/useCart';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export interface BrandProductGridProps {
  products: ProductSummaryDto[];
  brandSlug: string;
  brandName: string;
}

export function BrandProductGrid({
  products,
  brandSlug,
  brandName,
}: BrandProductGridProps) {
  const { addToCart, isAdding } = useCart();

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart({
        productId,
        quantity: 1,
        source: 'brand_storefront',
        channelBrandSlug: brandSlug,
      });
    } catch (err) {
      console.error('Failed to add brand product to cart:', err);
    }
  };

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card/40 my-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <ShoppingBag className="h-7 w-7" />
        </div>
        <h3 className="font-heading text-lg font-bold text-foreground">
          No Products Currently Listed
        </h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          {brandName} is currently updating their dispensary partner inventory drops. Check back soon or explore the main cannabis catalog.
        </p>
        <div className="mt-6">
          <Link href="/shop">
            <Button className="font-bold min-h-[44px] px-6">
              Browse Full Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  );
}
