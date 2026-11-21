import * as React from 'react';
import { Metadata } from 'next';
import { serverFetch } from '@/lib/server-api';
import { ProductSummaryDto, CategorySummaryDto, BrandSummaryDto } from '@/types/api.generated';
import { StoreHeader } from '@/components/layout/store-header';
import { StoreFooter } from '@/components/layout/store-footer';
import { CatalogView } from '@/components/catalog/catalog-view';

export const metadata: Metadata = {
  title: 'Cannabis Catalog — Owtlet™',
  description: 'Browse premier NY craft cannabis, pre-rolls, vapes, and concentrates with live store availability.',
};

export interface ShopPageProps {
  searchParams?: {
    category?: string;
    strainType?: string;
    minThc?: string;
    maxThc?: string;
    brand?: string;
    q?: string;
    cursor?: string;
    limit?: string;
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const category = searchParams?.category;
  const strainType = searchParams?.strainType;
  const toPct = (v?: string) => {
    const n = v === undefined ? NaN : Number(v);
    return Number.isFinite(n) && n >= 0 && n <= 100 ? n : undefined;
  };
  const minThc = toPct(searchParams?.minThc);
  const maxThc = toPct(searchParams?.maxThc);
  const brand = searchParams?.brand;
  const q = searchParams?.q;
  const cursor = searchParams?.cursor;
  const limit = searchParams?.limit ? parseInt(searchParams.limit, 10) : 24;

  const queryParams = new URLSearchParams();
  if (category) queryParams.set('category', category);
  if (strainType) queryParams.set('strainType', strainType);
  if (minThc !== undefined) queryParams.set('minThc', String(minThc));
  if (maxThc !== undefined) queryParams.set('maxThc', String(maxThc));
  if (brand) queryParams.set('brand', brand);
  if (q) queryParams.set('q', q);
  if (cursor) queryParams.set('cursor', cursor);
  if (limit) queryParams.set('limit', String(limit));

  const [productsResult, categories, brandsResult] = await Promise.all([
    serverFetch<{ items: ProductSummaryDto[]; nextCursor: string | null }>(
      `/products?${queryParams.toString()}`
    ),
    serverFetch<CategorySummaryDto[]>('/products/categories').catch(() => []),
    serverFetch<{ items: BrandSummaryDto[] }>('/brands').catch(() => ({ items: [] })),
  ]);

  const categoriesWithAll = [
    { slug: '', name: 'All Products' },
    ...(categories || []),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StoreHeader />
      <main className="flex-1">
        <CatalogView
          initialProducts={productsResult?.items || []}
          initialNextCursor={productsResult?.nextCursor || null}
          categories={categoriesWithAll}
          brands={brandsResult?.items || []}
          currentCategory={category}
        />
      </main>
      <StoreFooter />
    </div>
  );
}
