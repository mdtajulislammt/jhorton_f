import * as React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { listProducts } from '@/server/products';
import { prisma } from '@/server/db';
import { StoreHeader } from '@/components/layout/store-header';
import { StoreFooter } from '@/components/layout/store-footer';
import { CatalogView } from '@/components/catalog/catalog-view';

export interface CategoryPageProps {
  params: {
    category: string;
  };
  searchParams?: {
    strainType?: string;
    brand?: string;
    q?: string;
    cursor?: string;
    limit?: string;
  };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const categoryRecord = await prisma.category.findUnique({
    where: { slug: params.category },
  });

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

  const [categoryRecord, categories, brands] = await Promise.all([
    prisma.category.findUnique({
      where: { slug: categorySlug },
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

  if (!categoryRecord) {
    notFound();
  }

  const strainType = searchParams?.strainType;
  const brand = searchParams?.brand;
  const q = searchParams?.q;
  const cursor = searchParams?.cursor;
  const limit = searchParams?.limit ? parseInt(searchParams.limit, 10) : 24;

  const productsResult = await listProducts({
    category: categorySlug,
    strainType,
    brand,
    q,
    cursor,
    limit,
  });

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
          initialProducts={productsResult.items}
          initialNextCursor={productsResult.nextCursor}
          categories={categoriesWithAll}
          brands={brands}
          currentCategory={categorySlug}
        />
      </main>
      <StoreFooter />
    </div>
  );
}

