import * as React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { listActiveBrands } from '@/server/brands';
import { prisma } from '@/server/db';
import { StoreHeader } from '@/components/layout/store-header';
import { StoreFooter } from '@/components/layout/store-footer';
import { BrandGrid } from '@/components/modules/brands';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, ShoppingBag } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Brand Storefronts & Partner Channels — Owtlet™',
  description: 'Explore verified New York cannabis cultivators and brand channels. Shop directly from brand storefronts fulfilled by authorized partner dispensaries.',
};

export const revalidate = 60;

export default async function BrandsIndexPage() {
  const brands = await listActiveBrands();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <StoreHeader />

      <main className="flex-1 pb-16">
        {/* Hero Section */}
        <section className="border-b border-border bg-gradient-to-b from-card/80 to-background py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary font-semibold text-xs uppercase mb-3">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Verified Cultivator Network</span>
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                Official Brand Storefronts
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-2xl leading-relaxed">
                Discover leading New York craft cannabis cultivators, processors, and genetics. Shop their curated channels with orders fulfilled exclusively by their authorized partner dispensaries.
              </p>
            </div>
          </div>
        </section>

        {/* Brands Grid Section */}
        <section className="py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-xl font-bold text-foreground">
                  All Brands
                </h2>
                <Badge variant="outline" className="text-xs font-semibold">
                  {brands.length} {brands.length === 1 ? 'Brand' : 'Brands'}
                </Badge>
              </div>

              <Link href="/shop">
                <Button variant="ghost" size="sm" className="text-xs font-semibold">
                  Browse All Products →
                </Button>
              </Link>
            </div>

            <BrandGrid brands={brands} />
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}

