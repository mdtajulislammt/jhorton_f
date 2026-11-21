'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, PackageSearch } from 'lucide-react';
import type { ProductSummaryDto } from '@/types/api.generated';
import { ProductCard } from './product-card';
import { ProductGridSkeleton } from './catalog-skeleton';
import { ActiveFilterChips, CatalogTransitionContext, FilterRail, MobileFilterSheet } from './filter-rail';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

export interface CatalogViewProps {
  title?: string;
  subtitle?: string;
  initialProducts: ProductSummaryDto[];
  initialNextCursor: string | null;
  categories: Array<{ slug: string; name: string }>;
  brands: Array<{ slug: string; name: string }>;
  currentCategory?: string;
}

/** Shop page (design v3 `.shop`): filter rail card on the left, title bar + chips + 3-up grid on the right. */
export function CatalogView({
  title = 'Shop all',
  subtitle,
  initialProducts,
  initialNextCursor,
  brands,
  currentCategory = '',
}: CatalogViewProps) {
  const searchParams = useSearchParams();
  const params = React.useMemo(() => new URLSearchParams(searchParams?.toString() ?? ''), [searchParams]);
  const [isPending, startTransition] = React.useTransition();

  const [products, setProducts] = React.useState<ProductSummaryDto[]>(initialProducts);
  const [nextCursor, setNextCursor] = React.useState<string | null>(initialNextCursor);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [loadMoreError, setLoadMoreError] = React.useState(false);

  // Sync state when the server page re-renders with new filters.
  React.useEffect(() => {
    setProducts(initialProducts);
    setNextCursor(initialNextCursor);
    setLoadMoreError(false);
  }, [initialProducts, initialNextCursor]);

  const activeCount = ['q', 'strainType', 'brand'].filter((k) => params.get(k)).length + (params.get('minThc') || params.get('maxThc') ? 1 : 0);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    setLoadMoreError(false);

    try {
      const query = new URLSearchParams(params.toString());
      if (currentCategory) query.set('category', currentCategory);
      query.set('cursor', nextCursor);
      const res = await fetch(`/api/products?${query.toString()}`);
      const data = await res.json();

      if (data.success && data.data?.items) {
        setProducts((prev) => [...prev, ...data.data.items]);
        setNextCursor(data.data.nextCursor || null);
      } else {
        setLoadMoreError(true);
      }
    } catch {
      setLoadMoreError(true);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const maxStores = products.reduce((m, p) => Math.max(m, p.availableAtCount), 0);

  return (
    <CatalogTransitionContext.Provider value={startTransition}>
      <div className="mx-auto grid max-w-content gap-6 px-4 py-6 sm:px-7 lg:grid-cols-[240px_1fr]">
        {/* Desktop rail */}
        <aside className="hidden lg:block" aria-label="Catalog filters">
          <div className="sticky top-36">
            <FilterRail brands={brands} />
          </div>
        </aside>

        <div className="min-w-0">
          {/* Title bar */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-heading text-[26px] leading-tight text-foreground">{title}</h1>
              <p className="font-mono text-[13px] text-muted" aria-live="polite">
                {products.length}
                {nextCursor ? '+' : ''} product{products.length === 1 ? '' : 's'}
                {maxStores > 0 ? ` · up to ${maxStores} store${maxStores === 1 ? '' : 's'}` : ''}
              </p>
              {subtitle ? <p className="sr-only">{subtitle}</p> : null}
            </div>
            <MobileFilterSheet brands={brands} activeCount={activeCount} />
          </div>

          <div className="mb-4 empty:hidden">
            <ActiveFilterChips brands={brands} />
          </div>

          {isPending ? (
            <ProductGridSkeleton count={6} />
          ) : products.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No cannabis products found"
              description="We couldn't find any products matching your active filters. Try adjusting your search query, strain type, THC range, or category."
              action={{ label: 'View All Products', href: '/shop' }}
            />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-[18px] md:grid-cols-3" data-testid="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {nextCursor && !isPending ? (
            <div className="flex flex-col items-center gap-2 pt-8">
              <Button variant="ink" size="lg" onClick={handleLoadMore} disabled={isLoadingMore} className="min-h-[48px] px-8 font-bold">
                {isLoadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Products...
                  </>
                ) : (
                  'Load More Products'
                )}
              </Button>
              {loadMoreError ? (
                <p role="alert" className="text-sm text-danger">
                  We couldn&apos;t load more products. Please try again.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </CatalogTransitionContext.Provider>
  );
}
