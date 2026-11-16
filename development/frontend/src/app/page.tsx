import Link from 'next/link';
import { prisma } from '@/server/db';
import { StoreHeader } from '@/components/layout/store-header';
import { StoreFooter } from '@/components/layout/store-footer';
import { TerrificEmbed } from '@/components/modules/live/TerrificEmbed';
import { ProductCard } from '@/components/catalog/product-card';
import { computeCatalogPricing, formatMoney } from '@/server/pricing';
import { ProductSummaryDto } from '@/server/products';
import { Sparkles, ShoppingBag, ShieldCheck, MapPin, Radio, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const revalidate = 60; // Revalidate every minute

export default async function HomePage() {
  // Query active or next scheduled live show with pinned products
  const activeShow = await prisma.liveShow.findFirst({
    where: {
      status: { in: ['LIVE', 'SCHEDULED'] },
    },
    orderBy: [
      { status: 'asc' }, // LIVE sorts before SCHEDULED alphabetically
      { scheduledAt: 'desc' },
    ],
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

  const pinnedProducts: ProductSummaryDto[] =
    activeShow?.products.map((sp) => {
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
    }) ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <StoreHeader />

      <main className="flex-1 pb-16">
        {/* Live Shopping Hero Section */}
        <section className="relative border-b border-border bg-gradient-to-b from-card/80 to-background py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Headline & Action */}
              <div className="lg:col-span-5 flex flex-col items-start space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent font-semibold text-xs tracking-wide uppercase">
                  <Radio className="h-3.5 w-3.5 animate-pulse" />
                  <span>Interactive Live Shopping</span>
                </div>

                <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground leading-tight">
                  Curated Drops. <br />
                  <span className="text-primary bg-foreground px-2.5 py-0.5 rounded-lg inline-block mt-1">
                    Live from NY.
                  </span>
                </h1>

                <p className="font-body text-base text-muted-foreground leading-relaxed">
                  {activeShow?.title
                    ? `${activeShow.title} — Tap pinned products to instantly add to your cart at exclusive Owtlet show pricing.`
                    : 'Watch licensed New York cultivators showcase fresh craft cannabis. Tap to cart in real-time with automated multi-dispensary routing.'}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {activeShow?.id ? (
                    <Link href={`/live/${activeShow.id}`}>
                      <Button className="bg-primary text-primary-foreground hover:bg-owtlet-volt font-bold shadow-sm">
                        <Radio className="mr-2 h-4 w-4" />
                        Join Live Experience
                      </Button>
                    </Link>
                  ) : null}
                  <Link href="/shop">
                    <Button variant="outline" className="border-border hover:bg-muted font-medium">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Browse Full Catalog
                    </Button>
                  </Link>
                </div>

                <div className="flex items-center gap-4 pt-4 text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    30-Min Show Hold
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    21+ Verified Only
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    Manhattan, BK & Queens
                  </span>
                </div>
              </div>

              {/* Right Column: Terrific Embed Player */}
              <div className="lg:col-span-7">
                <div className="rounded-2xl p-1 bg-gradient-to-tr from-primary/30 via-accent/20 to-border shadow-xl">
                  <TerrificEmbed
                    embeddingId={activeShow?.embeddingId || 'Cki70GhqvLgWGhJbSxg2'}
                    liveShowId={activeShow?.id}
                    source="terrific_live"
                    title={activeShow?.title || 'Owtlet Live Drop'}
                    showBadge={true}
                    aspectRatio="video"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pinned Show Products Rail */}
        {pinnedProducts.length > 0 && (
          <section className="py-12 border-b border-border/60">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-accent text-accent font-semibold text-xs">
                      Live Drop Featured
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium">
                      One-Price Show Specials
                    </span>
                  </div>
                  <h2 className="font-heading text-2xl text-foreground mt-1">
                    Pinned in Today&apos;s Show
                  </h2>
                </div>
                <Link
                  href="/shop"
                  className="hidden sm:inline-flex items-center text-sm font-semibold text-primary hover:underline"
                >
                  View All Products
                  <ArrowRight className="ml-1 h-4 w-4" />
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

        {/* Value Propositions Grid */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col transition-all hover:border-primary/40">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-foreground mb-4">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg text-foreground mb-2">Live Shopping SDK v2</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Powered by Terrific Live SDK v2. Synchronized cart actions, instant reservations, and seamless in-player checkout jump.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col transition-all hover:border-primary/40">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-foreground mb-4">
                  <MapPin className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg text-foreground mb-2">Multi-Dispensary Routing</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Automated ZIP allocation algorithm splits orders across licensed local dispensaries for pickup and fast delivery.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col transition-all hover:border-primary/40">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-foreground mb-4">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg text-foreground mb-2">21+ Zero-ID Compliance</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  HMAC-signed 21+ age verification without saving personal IDs, dates of birth, or payment credentials on Owtlet servers.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}
