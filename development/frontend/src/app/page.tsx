import { prisma } from '@/server/db';
import { isAgeVerified } from '@/server/age-session/verified';
import { StoreHeader } from '@/components/layout/store-header';
import { StoreFooter } from '@/components/layout/store-footer';
import { VideoReel } from '@/components/modules/home/VideoReel';
import { ProductCard } from '@/components/catalog/product-card';
import { HomeHero } from '@/components/modules/home/HomeHero';
import { StrainTicker } from '@/components/modules/home/StrainTicker';
import { ShowLineup } from '@/components/modules/home/ShowLineup';
import { CategoryShowcase } from '@/components/modules/home/CategoryShowcase';
import { HowItWorks } from '@/components/modules/home/HowItWorks';
import { CoverageBand } from '@/components/modules/home/CoverageBand';
import { SectionHeader } from '@/components/ui/section-header';
import { EmptyState } from '@/components/ui/empty-state';
import { computeCatalogPricing, formatMoney } from '@/server/pricing';
import { ProductSummaryDto } from '@/server/products';
import { formatPct } from '@/lib/utils';
import { TerrificEmbed } from '@/components/modules/live/TerrificEmbed';
import { BrandGrid } from '@/components/modules/brands';

export const revalidate = 60; // Revalidate every minute

export default async function HomePage() {
  // owt_age is HttpOnly; verify it here so the Terrific SDK only loads for 21+ visitors.
  const ageVerified = await isAgeVerified();
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

  const additionalShows = await prisma.liveShow.findMany({
    where: {
      id: { not: activeShow?.id || '' },
    },
    take: 6,
    orderBy: [
      { status: 'asc' },
      { scheduledAt: 'desc' },
      { createdAt: 'desc' },
    ],
    include: {
      brand: true,
      products: {
        include: {
          product: { select: { id: true, name: true, owtletPrice: true } },
        },
      },
    },
  });

  const replayAndUpcomingShows = additionalShows
    .filter((s) => s.format === 'LIVE_SHOW')
    .slice(0, 3)
    .map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      format: s.format,
      status: s.status,
      scheduledAt: s.scheduledAt ? s.scheduledAt.toISOString() : null,
      endedAt: s.endedAt ? s.endedAt.toISOString() : null,
      thumbnailUrl: s.thumbnailUrl,
      brand: s.brand ? { slug: s.brand.slug, name: s.brand.name } : null,
      products: s.products.map((p) => ({
        productId: p.product.id,
        name: p.product.name,
        owtletPrice: p.product.owtletPrice ? String(p.product.owtletPrice) : null,
      })),
    }));

  const shoppableVideos = additionalShows
    .filter((s) => s.format === 'SHOPPABLE_VIDEO')
    .slice(0, 3)
    .map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      format: s.format,
      status: s.status,
      scheduledAt: s.scheduledAt ? s.scheduledAt.toISOString() : null,
      endedAt: s.endedAt ? s.endedAt.toISOString() : null,
      thumbnailUrl: s.thumbnailUrl,
      brand: s.brand ? { slug: s.brand.slug, name: s.brand.name } : null,
      products: s.products.map((p) => ({
        productId: p.product.id,
        name: p.product.name,
        owtletPrice: p.product.owtletPrice ? String(p.product.owtletPrice) : null,
      })),
    }));


  // Brand Storefronts row (design v3): partner stores, product count, next show
  const brandRows = await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    take: 3,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      bannerUrl: true,
      sortOrder: true,
      dispensaries: { select: { dispensary: { select: { name: true, isActive: true } } } },
      _count: { select: { products: { where: { isActive: true } } } },
      liveShows: {
        where: { status: { in: ['LIVE', 'SCHEDULED'] } },
        select: { status: true, scheduledAt: true },
        orderBy: [{ status: 'asc' }, { scheduledAt: 'asc' }],
        take: 1,
      },
    },
  });

  const showTime = (d: Date) =>
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }).format(d);

  const brandCards = brandRows.map(({ dispensaries, _count, liveShows, ...b }) => {
    const next = liveShows[0];
    return {
      ...b,
      partnerNames: dispensaries.filter((d) => d.dispensary.isActive).map((d) => d.dispensary.name),
      productsCount: _count.products,
      nextShowLabel: next
        ? next.status === 'LIVE'
          ? 'Live tonight'
          : next.scheduledAt
            ? `Next show ${showTime(next.scheduledAt)}`
            : 'Show coming up'
        : null,
    };
  });

  // ---- View models for presentational sections (no new data queries) ----
  const heroShow = activeShow
    ? {
        id: activeShow.id,
        title: activeShow.title,
        status: activeShow.status,
        brandName: activeShow.brand?.name ?? null,
        startedAt: activeShow.startedAt ? activeShow.startedAt.toISOString() : null,
        scheduledAt: activeShow.scheduledAt ? activeShow.scheduledAt.toISOString() : null,
      }
    : null;

  const tickerItems = pinnedProducts.map((p) => ({
    key: p.id,
    name: p.strain?.name ?? p.name,
    type: p.strain?.type ?? null,
    detail: p.thcPercent ? `THC ${formatPct(p.thcPercent)}%` : p.category.name,
  }));

  const lineup = [
    ...(activeShow && (activeShow.status === 'LIVE' || activeShow.status === 'SCHEDULED')
      ? [
          {
            id: activeShow.id,
            title: activeShow.title,
            status: activeShow.status,
            brandName: activeShow.brand?.name ?? null,
            scheduledAt: activeShow.scheduledAt ? activeShow.scheduledAt.toISOString() : null,
            pinnedCount: activeShow.products.length,
          },
        ]
      : []),
    ...replayAndUpcomingShows
      .filter((s) => s.status === 'LIVE' || s.status === 'SCHEDULED')
      .map((s) => ({
        id: s.id,
        title: s.title,
        status: s.status,
        brandName: s.brand?.name ?? null,
        scheduledAt: s.scheduledAt,
        pinnedCount: s.products.length,
      })),
  ].slice(0, 4);

  const watchAgain = [
    ...replayAndUpcomingShows.filter((s) => s.status === 'REPLAY' || s.status === 'ARCHIVED'),
    ...shoppableVideos,
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <StoreHeader />

      <main className="flex-1">
        {/* Terrific SDK anchor (AC-LIVE-01). The embedding renders as Terrific's floating player, so no in-page frame. */}
        <TerrificEmbed
          bare
          ageVerified={ageVerified}
          embeddingId={activeShow?.embeddingId || 'Cki70GhqvLgWGhJbSxg2'}
          liveShowId={activeShow?.id}
          source="terrific_live"
          title={activeShow?.title || 'Owtlet Live'}
        />
        <HomeHero show={heroShow} featured={pinnedProducts[0] ?? null} pinnedCount={pinnedProducts.length} />
        <StrainTicker items={tickerItems} />

        <ShowLineup shows={lineup} />

        {/* Pinned in today's shows (design v3 4-up grid) */}
        <section className="mx-auto max-w-content px-4 pb-14 sm:px-7 lg:pb-[60px]">
          <SectionHeader
            title={activeShow?.status === 'LIVE' ? "Pinned in today's shows" : 'Pinned in the next show'}
            description="One Owtlet Price at every partner store. We route your Cart to the closest store with stock."
            action={{ href: '/shop', label: 'Shop all products' }}
          />
          {pinnedProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-[18px] lg:grid-cols-4">
              {pinnedProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No products pinned yet"
              description="Products appear here as soon as the next Live Show pins them. Browse the Shop in the meantime."
              action={{ label: 'Browse the Shop', href: '/shop' }}
            />
          )}
        </section>

        <CategoryShowcase />

        <VideoReel items={watchAgain} />

        <HowItWorks />

        {/* Brand Storefronts (design v3 3-up cards) */}
        <section className="mx-auto max-w-content px-4 pb-14 sm:px-7 lg:pb-[60px]">
          <SectionHeader
            title="Brand Storefronts"
            description="Every brand's shows, videos and products in one place."
            action={{ href: '/brands', label: 'All brands' }}
          />
          <BrandGrid brands={brandCards} />
        </section>

        <CoverageBand />
      </main>

      <StoreFooter flush />
    </div>
  );
}
