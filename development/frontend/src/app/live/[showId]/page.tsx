import * as React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/server/db';
import { StoreHeader } from '@/components/layout/store-header';
import { StoreFooter } from '@/components/layout/store-footer';
import { TerrificEmbed } from '@/components/modules/live/TerrificEmbed';
import { ProductCard } from '@/components/catalog/product-card';
import { computeCatalogPricing, formatMoney } from '@/server/pricing';
import { ProductSummaryDto } from '@/server/products';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, Clock, ShieldCheck, MapPin, ArrowLeft, ShoppingBag } from 'lucide-react';

interface LiveShowPageProps {
  params: {
    showId: string;
  };
}

export async function generateMetadata({ params }: LiveShowPageProps): Promise<Metadata> {
  const show = await prisma.liveShow.findFirst({
    where: {
      OR: [{ id: params.showId }, { terrificShowId: params.showId }],
    },
  });

  if (!show) {
    return {
      title: 'Live Show Not Found — Owtlet™',
    };
  }

  return {
    title: `${show.title} — Owtlet™ Live Shopping`,
    description: show.description || 'Watch live craft cannabis shopping with real-time drop reservations.',
  };
}

export default async function LiveShowPage({ params }: LiveShowPageProps) {
  const show = await prisma.liveShow.findFirst({
    where: {
      OR: [{ id: params.showId }, { terrificShowId: params.showId }],
    },
    include: {
      brand: true,
      products: {
        orderBy: { sortOrder: 'asc' },
        include: {
          product: {
            include: {
              category: { select: { slug: true, name: true } },
              strain: { select: { name: true, type: true } },
              brand: { select: { slug: true, name: true } },
              inventory: {
                include: { dispensary: true },
              },
            },
          },
        },
      },
    },
  });

  if (!show) {
    notFound();
  }

  const pinnedProducts: ProductSummaryDto[] = show.products.map((sp) => {
    const p = sp.product;
    const pricing = computeCatalogPricing(p, p.inventory);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      category: p.category,
      strain: p.strain,
      thcPercent: p.thcPercent ? formatMoney(p.thcPercent) : null,
      cbdPercent: p.cbdPercent ? formatMoney(p.cbdPercent) : null,
      weightGrams: p.weightGrams ? formatMoney(p.weightGrams) : null,
      imageUrls: p.imageUrls,
      brand: p.brand,
      priceMode: pricing.priceMode,
      owtletPrice: pricing.owtletPrice,
      fromPrice: pricing.fromPrice,
      availableAtCount: p.inventory.filter((inv) => inv.stockQty > 0).length,
    };
  });

  const isLive = show.status === 'LIVE';
  const isReplay = show.status === 'REPLAY';
  const source = isReplay ? 'terrific_replay' : 'terrific_live';

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <StoreHeader />

      <main className="flex-1 pb-16">
        {/* Navigation Breadcrumb / Back Link */}
        <div className="border-b border-border/60 bg-muted/20 py-3">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Link
              href="/live"
              className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              All Live Shows & Replays
            </Link>
          </div>
        </div>

        {/* Video Player & Info Section */}
        <section className="py-6 sm:py-8 border-b border-border/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left / Top: Terrific Video Player */}
              <div className="lg:col-span-8">
                <TerrificEmbed
                  embeddingId={show.embeddingId}
                  liveShowId={show.id}
                  source={source}
                  title={show.title}
                  showBadge={true}
                  aspectRatio="video"
                  className="w-full shadow-lg"
                />

                {/* Show Details Bar */}
                <div className="mt-6 flex flex-col space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {isLive ? (
                      <Badge className="bg-accent text-accent-foreground font-bold text-xs uppercase px-2.5 py-0.5 animate-pulse flex items-center gap-1">
                        <Radio className="h-3 w-3" />
                        LIVE STREAMING
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs font-semibold uppercase">
                        {show.status}
                      </Badge>
                    )}

                    {show.brand && (
                      <Badge variant="secondary" className="text-xs font-medium">
                        Presented by {show.brand.name}
                      </Badge>
                    )}

                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Show End + 30 Min Cart Hold
                    </span>
                  </div>

                  <h1 className="font-heading text-2xl sm:text-3xl text-foreground">
                    {show.title}
                  </h1>

                  {show.description && (
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl">
                      {show.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Show Info & Quick Compliance Box */}
              <div className="lg:col-span-4 flex flex-col space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <h3 className="font-heading text-base text-foreground flex items-center gap-2">
                    <Radio className="h-4 w-4 text-accent" />
                    How Live Shopping Works
                  </h3>

                  <ul className="text-xs text-muted-foreground space-y-2.5 leading-normal">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-foreground">1.</span>
                      <span>Tap any pinned product in the video stream to add to your Owtlet cart instantly.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-foreground">2.</span>
                      <span>Show items feature uniform Owtlet pricing across all partner dispensaries.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-foreground">3.</span>
                      <span>Your cart reservation is held until 30 minutes after the show ends.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-foreground">4.</span>
                      <span>Tap checkout to route items to your nearest licensed dispensary.</span>
                    </li>
                  </ul>

                  <div className="pt-2 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                    <span>21+ Adult-Use NY Legal Cannabis Only</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
                  <h4 className="font-heading text-sm text-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Fulfillment Coverage
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Delivery and pickup available across Manhattan, Brooklyn, Queens, Westchester, and Long Island from licensed retail dispensaries.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pinned Products Section */}
        {pinnedProducts.length > 0 && (
          <section className="py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="font-heading text-2xl text-foreground">
                    Pinned Products in This Show ({pinnedProducts.length})
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tap to add to cart or view strain profiles and retail availability.
                  </p>
                </div>
                <Link href="/shop">
                  <Button variant="outline" size="sm" className="border-border">
                    <ShoppingBag className="mr-1.5 h-4 w-4" />
                    Browse Catalog
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                {pinnedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <StoreFooter />
    </div>
  );
}
