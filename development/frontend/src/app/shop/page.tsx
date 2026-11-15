import * as React from 'react';
import { Metadata } from 'next';
import { listProducts } from '@/server/products';
import { prisma } from '@/server/db';
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
  const brand = searchParams?.brand;
  const q = searchParams?.q;
  const cursor = searchParams?.cursor;
  const limit = searchParams?.limit ? parseInt(searchParams.limit, 10) : 24;

  const [productsResult, categories, brands] = await Promise.all([
    listProducts({
      category,
      strainType,
      brand,
      q,
      cursor,
      limit,
    }),
    prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { slug: true, name: true },
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { slug: true, name: true },
    }),
  ]);

  const categoriesWithAll = [
    { slug: '', name: 'All Products' },
    ...categories,
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StoreHeader />
      <main className="flex-1">
        <CatalogView
          initialProducts={productsResult.items}
          initialNextCursor={productsResult.nextCursor}
          categories={categoriesWithAll}
          brands={brands}
          currentCategory={category}
        />
      </main>
      <StoreFooter />
    </div>
  );
}

