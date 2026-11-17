import { StoreHeader } from '@/components/layout/store-header';
import { ProductDetailSkeleton } from '@/components/catalog/catalog-skeleton';

export default function ProductLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StoreHeader />
      <main className="flex-1">
        <ProductDetailSkeleton />
      </main>
    </div>
  );
}
