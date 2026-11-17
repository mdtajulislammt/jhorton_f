import * as React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBrandStorefront, BrandNotFoundError } from '@/server/brands';
import { StoreHeader } from '@/components/layout/store-header';
import { StoreFooter } from '@/components/layout/store-footer';
import { BrandHero, BrandProductGrid } from '@/components/modules/brands';
import { ShowRail } from '@/components/modules/live/ShowRail';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Radio } from 'lucide-react';

export interface BrandStorefrontPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: BrandStorefrontPageProps): Promise<Metadata> {
  try {
    const storefront = await getBrandStorefront(params.slug);
    return {
      title: `${storefront.brand.name} — Brand Storefront | Owtlet™`,
      description:
        storefront.brand.description ||
        `Shop official ${storefront.brand.name} cannabis products fulfilled by verified partner dispensaries in New York.`,
    };
  } catch {
    return {
      title: 'Brand Not Found — Owtlet™',
    };
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export default async function BrandStorefrontPage({
  params,
}: BrandStorefrontPageProps) {
  let storefront;
  try {
    storefront = await getBrandStorefront(params.slug);
  } catch (error) {
    if (error instanceof BrandNotFoundError) {
      notFound();
    }
    throw error;
  }

  const { brand, products, dispensaries, shows } = storefront;

  // Format shows for ShowRail
  const formattedShows = shows.map((s: any) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    format: s.format,
    status: s.status,
    scheduledAt: s.scheduledAt,
    endedAt: s.endedAt,
    thumbnailUrl: s.thumbnailUrl,
    brand: s.brand ? { slug: s.brand.slug, name: s.brand.name } : null,
    products: (s.products || []).map((p: any) => ({
      productId: p.productId,
      name: p.name,
      owtletPrice: p.owtletPrice,
    })),
  }));

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <StoreHeader />

      <main className="flex-1 pb-16">
        {/* Brand Hero & Partner Dispensaries Banner */}
        <BrandHero
          brand={brand}
          dispensaries={dispensaries}
          productCount={products.length}
        />

        {/* Brand Live Shows & Shoppable Videos Section (if any) */}
        {formattedShows.length > 0 && (
          <div className="mx-auto max-w-content px-4 sm:px-7 mt-10">
            <ShowRail
              title={`${brand.name} Live & Video Drops`}
              description={`Watch live cultivator sessions, master drops, and shoppable reels from ${brand.name}.`}
              badgeText="Brand Broadcasts"
              badgeIcon="live"
              shows={formattedShows}
            />
          </div>
        )}

        {/* Curated Products Catalog */}
        <section className="mx-auto max-w-content px-4 sm:px-7 mt-10 sm:mt-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                Catalog & Drops
              </h2>
              <Badge variant="outline" className="text-xs font-semibold">
                {products.length} {products.length === 1 ? 'Product' : 'Products'}
              </Badge>
            </div>
          </div>

          <BrandProductGrid
            products={products}
            brandSlug={brand.slug}
            brandName={brand.name}
          />
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}

