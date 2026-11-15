'use client';

import * as React from 'react';
import { ProductSummaryDto } from '@/server/products';
import { ProductCard } from './product-card';
import { FilterBar } from './filter-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Sparkles, PackageSearch, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface CatalogViewProps {
  title?: string;
  subtitle?: string;
  initialProducts: ProductSummaryDto[];
  initialNextCursor: string | null;
  categories: Array<{ slug: string; name: string }>;
  brands: Array<{ slug: string; name: string }>;
  currentCategory?: string;
}

export function CatalogView({
  title = 'Craft Cannabis Catalog',
  subtitle = 'Curated adult-use flower, pre-rolls, vapes, and concentrates from licensed New York cultivators.',
  initialProducts,
  initialNextCursor,
  categories,
  brands,
  currentCategory,
}: CatalogViewProps) {
  const router = useRouter();
  const [products, setProducts] = React.useState<ProductSummaryDto[]>(initialProducts);
  const [nextCursor, setNextCursor] = React.useState<string | null>(initialNextCursor);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  // Sync state when props change (e.g. from server component navigation)
  React.useEffect(() => {
    setProducts(initialProducts);
    setNextCursor(initialNextCursor);
  }, [initialProducts, initialNextCursor]);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('cursor', nextCursor);
      const res = await fetch(`/api/products${currentUrl.search}`);
      const data = await res.json();

      if (data.success && data.data?.items) {
        setProducts((prev) => [...prev, ...data.data.items]);
        setNextCursor(data.data.nextCursor || null);
      }
    } catch (err) {
      console.error('Failed to load more products:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleAddToCart = (productId: string) => {
    // Navigates or adds item to cart
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      router.push(`/product/${prod.slug}`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Title & Headline Banner */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-0.5 text-xs font-semibold text-owtlet-ink">
          <Sparkles className="h-3.5 w-3.5 text-owtlet-ink" />
          <span>New York Adult-Use 21+</span>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-foreground">
          {title}
        </h1>
        <p className="max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        categories={categories}
        brands={brands}
        totalCount={products.length}
      />

      {/* Product Grid or Empty State */}
      {products.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No cannabis products found"
          description="We couldn't find any products matching your active filters. Try adjusting your search query, strain type, or category."
          action={{
            label: 'View All Products',
            href: '/shop',
          }}
          className="my-12"
        />
      ) : (
        <div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          data-testid="product-grid"
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}

      {/* Cursor Pagination (Load More) */}
      {nextCursor && (
        <div className="pt-8 flex justify-center">
          <Button
            variant="secondary"
            size="lg"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="min-h-[48px] px-8 font-bold active:scale-[0.98] shadow-sm"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Products...
              </>
            ) : (
              'Load More Products'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

