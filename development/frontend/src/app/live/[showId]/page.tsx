import * as React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import { isAgeVerified } from '@/lib/session';
import { formatMoney } from '@/lib/pricing';
import { LiveShowDto, ProductSummaryDto } from '@/types/api.generated';
import { StoreHeader } from '@/components/layout/store-header';
import { StoreFooter } from '@/components/layout/store-footer';
import { TerrificEmbed } from '@/components/modules/live/TerrificEmbed';
import { ProductCard } from '@/components/catalog/product-card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeader } from '@/components/ui/section-header';
import { Radio, Clock, ShieldCheck, MapPin, ArrowLeft, ShoppingBag } from 'lucide-react';

interface LiveShowPageProps {
  params: {
    showId: string;
  };
}

export async function generateMetadata({ params }: LiveShowPageProps): Promise<Metadata> {
  const show = await serverFetch<LiveShowDto>(`/live-shows/${params.showId}`).catch(() => null);

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
  // owt_age is HttpOnly; verify it here so the Terrific SDK only loads for 21+ visitors.
  const ageVerified = await isAgeVerified();
  let show: LiveShowDto;
  try {
    show = await serverFetch<LiveShowDto>(`/live-shows/${params.showId}`);
  } catch (error: any) {
    if (error?.status === 404 || error?.code === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }

  if (!show || (show as any).code === 'NOT_FOUND') {
    notFound();
  }

  const pinnedProducts: ProductSummaryDto[] = (show.products || []).map((sp: any) => {
    return {
      id: sp.productId || sp.id,
      slug: sp.slug || sp.id,
      name: sp.name,
      description: sp.description || null,
      category: { slug: sp.categorySlug || 'flower', name: sp.categoryName || 'Flower' },
      strain: sp.strainName ? { name: sp.strainName, type: (sp.strainType || 'HYBRID') as any } : null,
      thcPercent: sp.thcPercent ? formatMoney(sp.thcPercent) : null,
      cbdPercent: sp.cbdPercent ? formatMoney(sp.cbdPercent) : null,
      weightGrams: sp.weightGrams ? formatMoney(sp.weightGrams) : null,
      imageUrls: sp.imageUrls || [],
      brand: show.brand ? { slug: show.brand.slug, name: show.brand.name } : null,
      priceMode: 'OWTLET',
      owtletPrice: sp.owtletPrice ? formatMoney(sp.owtletPrice) : '0.00',
      fromPrice: sp.owtletPrice ? formatMoney(sp.owtletPrice) : '0.00',
      availableAtCount: 1,
    };
  });

  const isLive = show.status === 'LIVE';
  const isReplay = show.status === 'REPLAY';
  const isScheduled = show.status === 'SCHEDULED';
  const source = isReplay ? 'terrific_replay' : 'terrific_live';

  const scheduledLabel = show.scheduledAt
    ? new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/New_York',
        timeZoneName: 'short',
      }).format(new Date(show.scheduledAt))
    : null;

  const steps = [
    'Tap any pinned product in the stream, or below, to add it to your Owtlet cart.',
    'Show items carry one Owtlet price at every partner dispensary.',
    'Your cart is held until 30 minutes after the show ends.',
    'Check out and we route your order to licensed stores near you.',
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <StoreHeader />

      <main className="flex-1">
        {/* Stage */}
        <section className="dark bg-background text-foreground">
          <div className="mx-auto max-w-content px-4 pb-8 pt-4 sm:px-7 lg:pb-10">
            <Link
              href="/live"
              className="mb-4 inline-flex min-h-[36px] items-center rounded-sm text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              All Live Shows &amp; Replays
            </Link>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
              <div className="space-y-4 lg:col-span-8">
                <div className="overflow-hidden rounded-3xl p-1 bg-gradient-to-tr from-primary/30 via-accent/20 to-border shadow-xl">
                  <TerrificEmbed
                    ageVerified={ageVerified}
                    embeddingId={show.embeddingId || 'Cki70GhqvLgWGhJbSxg2'}
                    liveShowId={show.id}
                    source={source}
                    title={show.title}
                    showBadge={false}
                    aspectRatio="video"
                    className="w-full"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {isLive ? (
                      <Badge variant="default" className="bg-destructive text-destructive-foreground animate-pulse">
                        LIVE NOW
                      </Badge>
                    ) : isReplay ? (
                      <Badge variant="secondary">DROP REPLAY</Badge>
                    ) : (
                      <Badge variant="outline" className="uppercase">{show.status}</Badge>
                    )}
                    {show.brand ? (
                      <Link
                        href={`/brands/${show.brand.slug}`}
                        className="inline-flex min-h-[28px] items-center rounded-full bg-card px-3 text-xs font-semibold text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Presented by {show.brand.name}
                      </Link>
                    ) : null}
                    {isScheduled && scheduledLabel ? (
                      <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {scheduledLabel}
                      </span>
                    ) : null}
                  </div>

                  <h1 className="font-heading text-2xl tracking-tight text-foreground text-balance sm:text-3xl lg:text-4xl">
                    {show.title}
                  </h1>

                  {show.description ? (
                    <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">{show.description}</p>
                  ) : null}
                </div>
              </div>

              <aside className="space-y-4 lg:col-span-4">
                <div className="space-y-4 rounded-3xl bg-card p-5 sm:p-6">
                  <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                    <Radio className="h-4 w-4 text-accent" aria-hidden="true" />
                    How live shopping works
                  </h2>
                  <ol className="space-y-3">
                    {steps.map((step, i) => (
                      <li key={step} className="flex items-start gap-3 text-sm leading-snug text-muted-foreground">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary font-mono text-xs font-bold text-primary-foreground">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    Cart held until show end + 30 minutes
                  </div>
                </div>

                <div className="space-y-2 rounded-3xl bg-card p-5 sm:p-6">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                    Fulfillment coverage
                  </h2>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Delivery and pickup across Manhattan, Brooklyn, Queens, Westchester, and Long Island from licensed retail
                    dispensaries.
                  </p>
                  <p className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    21+ Adult-Use NY Legal Cannabis Only
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Pinned products */}
        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-content px-4 sm:px-7">
            <SectionHeader
              title={`Pinned in this show (${pinnedProducts.length})`}
              description="Add straight to your cart, or open a product for strain details and store availability."
              action={{ href: '/shop', label: 'Browse catalog' }}
            />

            {pinnedProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                {pinnedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ShoppingBag}
                title={isScheduled ? 'Products drop when the show goes live' : 'No products pinned to this show'}
                description="Browse the catalog for flower, pre-rolls, vapes and more available at partner dispensaries."
                action={{ label: 'Browse Catalog', href: '/shop' }}
              />
            )}
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}
