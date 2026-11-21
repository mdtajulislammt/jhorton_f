import * as React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverFetch } from '@/lib/server-api';
import { ProductSummaryDto, CategorySummaryDto, BrandSummaryDto } from '@/types/api.generated';
import { StoreHeader } from '@/components/layout/store-header';
import { StoreFooter } from '@/components/layout/store-footer';
import { CatalogView } from '@/components/catalog/catalog-view';

export interface CategoryPageProps {
  params: {
    category: string;
  };
  searchParams?: {
    strainType?: string;
    minThc?: string;
    maxThc?: string;
    brand?: string;
    q?: string;
    cursor?: string;
    limit?: string;
  };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const categories = await serverFetch<CategorySummaryDto[]>('/products/categories').catch(() => []);
  const categoryRecord = categories.find((c) => c.slug === params.category);

  if (!categoryRecord) {
    return {
      title: 'Category Not Found — Owtlet™',
    };
  }

  return {
    title: `${categoryRecord.name} — Owtlet™ Cannabis Catalog`,
    description: `Shop lab-tested ${categoryRecord.name.toLowerCase()} available for pickup and delivery in NY.`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const categorySlug = params.category;

  const [categories, brandsResult] = await Promise.all([
    serverFetch<CategorySummaryDto[]>('/products/categories').catch(() => []),
    serverFetch<{ items: BrandSummaryDto[] }>('/brands').catch(() => ({ items: [] })),
  ]);

  const categoryRecord = categories.find((c) => c.slug === categorySlug);
  if (!categoryRecord) {
    notFound();
  }

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
  queryParams.set('category', categorySlug);
  if (strainType) queryParams.set('strainType', strainType);
  if (minThc !== undefined) queryParams.set('minThc', String(minThc));
  if (maxThc !== undefined) queryParams.set('maxThc', String(maxThc));
  if (brand) queryParams.set('brand', brand);
  if (q) queryParams.set('q', q);
  if (cursor) queryParams.set('cursor', cursor);
  if (limit) queryParams.set('limit', String(limit));

  const productsResult = await serverFetch<{ items: ProductSummaryDto[]; nextCursor: string | null }>(
    `/products?${queryParams.toString()}`
  );

  const categoriesWithAll = [
    { slug: '', name: 'All Products' },
    ...categories,
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StoreHeader />
      <main className="flex-1">
        <CatalogView
          title={categoryRecord.name}
          subtitle={`Discover premium NY-grown and extracted ${categoryRecord.name.toLowerCase()}. Verified inventory at partner dispensaries.`}
          initialProducts={productsResult?.items || []}
          initialNextCursor={productsResult?.nextCursor || null}
          categories={categoriesWithAll}
          brands={brandsResult?.items || []}
          currentCategory={categorySlug}
        />
      </main>
      <StoreFooter />
    </div>
  );
}
