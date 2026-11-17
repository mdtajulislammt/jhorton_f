import { StoreHeader } from '@/components/layout/store-header';
import { ProductGridSkeleton } from '@/components/catalog/catalog-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function ShopLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StoreHeader />
      <main className="flex-1">
        <div className="mx-auto grid max-w-content gap-6 px-4 py-6 sm:px-7 lg:grid-cols-[240px_1fr]">
          <div className="hidden space-y-4 rounded-[18px] border border-border bg-card p-[18px] lg:block">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="min-w-0 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <ProductGridSkeleton count={6} />
          </div>
        </div>
      </main>
    </div>
  );
}
