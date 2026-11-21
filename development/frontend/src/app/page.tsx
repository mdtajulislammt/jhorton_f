import { isAgeVerified } from '@/lib/session';
import { serverFetch } from '@/lib/server-api';
import { formatMoney } from '@/lib/pricing';
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
import { ProductSummaryDto, LiveShowDto, BrandSummaryDto } from '@/types/api.generated';
import { formatPct } from '@/lib/utils';
import { TerrificEmbed } from '@/components/modules/live/TerrificEmbed';
import { BrandGrid } from '@/components/modules/brands';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every minute

export default async function HomePage() {
  // owt_age is HttpOnly; verify it here so the Terrific SDK only loads for 21+ visitors.
  const ageVerified = await isAgeVerified();

  const [showsResult, brandsResult] = await Promise.all([
    serverFetch<{ items: LiveShowDto[] }>('/live-shows').catch(() => ({ items: [] })),
    serverFetch<{ items: BrandSummaryDto[] }>('/brands').catch(() => ({ items: [] })),
  ]);

  const allShows = showsResult?.items || [];
  const brands = brandsResult?.items || [];

  // Active show: LIVE first, then SCHEDULED
  const activeShow =
    allShows.find((s) => s.status === 'LIVE' && s.format === 'LIVE_SHOW') ||
    allShows.find((s) => s.status === 'SCHEDULED' && s.format === 'LIVE_SHOW') ||
    allShows[0] ||
    null;

  const pinnedProducts: ProductSummaryDto[] = (activeShow?.products || []).map((sp: any) => {
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
      brand: activeShow?.brand ? { slug: activeShow.brand.slug, name: activeShow.brand.name } : null,
      priceMode: 'OWTLET',
      owtletPrice: sp.owtletPrice ? formatMoney(sp.owtletPrice) : '0.00',
      fromPrice: sp.owtletPrice ? formatMoney(sp.owtletPrice) : '0.00',
      availableAtCount: 1,
    };
  });

  const additionalShows = allShows.filter((s) => s.id !== activeShow?.id);

  const replayAndUpcomingShows = additionalShows
    .filter((s) => s.format === 'LIVE_SHOW')
    .slice(0, 3)
    .map((s) => ({
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
        productId: p.productId || p.id,
        name: p.name,
        owtletPrice: p.owtletPrice ? String(p.owtletPrice) : null,
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
      scheduledAt: s.scheduledAt,
      endedAt: s.endedAt,
      thumbnailUrl: s.thumbnailUrl,
      brand: s.brand ? { slug: s.brand.slug, name: s.brand.name } : null,
      products: (s.products || []).map((p: any) => ({
        productId: p.productId || p.id,
        name: p.name,
        owtletPrice: p.owtletPrice ? String(p.owtletPrice) : null,
      })),
    }));

  const heroShow = activeShow
    ? {
        id: activeShow.id,
        title: activeShow.title,
        status: activeShow.status,
        brandName: activeShow.brand?.name ?? null,
        startedAt: activeShow.startedAt || null,
        scheduledAt: activeShow.scheduledAt || null,
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
            scheduledAt: activeShow.scheduledAt || null,
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

        {/* Pinned in today's shows */}
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

        {/* Brand Storefronts */}
        <section className="mx-auto max-w-content px-4 pb-14 sm:px-7 lg:pb-[60px]">
          <SectionHeader
            title="Brand Storefronts"
            description="Every brand's shows, videos and products in one place."
            action={{ href: '/brands', label: 'All brands' }}
          />
          <BrandGrid brands={brands} />
        </section>

        <CoverageBand />
      </main>

      <StoreFooter flush />
    </div>
  );
}
