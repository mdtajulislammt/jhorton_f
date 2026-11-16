import * as React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/server/db';
import { StoreHeader } from '@/components/layout/store-header';
import { StoreFooter } from '@/components/layout/store-footer';
import { TerrificEmbed } from '@/components/modules/live/TerrificEmbed';
import { PinnedProductRail } from '@/components/modules/live/PinnedProductRail';
import { LiveBadge } from '@/components/modules/live/LiveBadge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, ShieldCheck, MapPin, Clock } from 'lucide-react';
import { formatMoney } from '@/server/pricing';

interface ShoppableVideoPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: ShoppableVideoPageProps): Promise<Metadata> {
  const video = await prisma.liveShow.findFirst({
    where: {
      OR: [{ id: params.id }, { terrificShowId: params.id }],
    },
  });

  if (!video) {
    return {
      title: 'Shoppable Video Not Found — Owtlet™',
    };
  }

  return {
    title: `${video.title} — Owtlet™ Shoppable Video`,
    description: video.description || 'Watch interactive craft cannabis video reels with tap-to-cart show pricing.',
  };
}

export default async function ShoppableVideoPage({ params }: ShoppableVideoPageProps) {
  const video = await prisma.liveShow.findFirst({
    where: {
      OR: [{ id: params.id }, { terrificShowId: params.id }],
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
            },
          },
        },
      },
    },
  });

  if (!video) {
    notFound();
  }

  const pinnedProducts = video.products.map((sp) => {
    const p = sp.product;
    return {
      productId: p.id,
      slug: p.slug,
      name: p.name,
      terrificProductId: p.terrificProductId,
      owtletPrice: p.owtletPrice ? formatMoney(p.owtletPrice) : '0.00',
      imageUrls: p.imageUrls,
      categoryName: p.category?.name ?? null,
      strainName: p.strain?.name ?? null,
      sortOrder: sp.sortOrder,
    };
  });

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <StoreHeader />

      <main className="flex-1 pb-16">
        {/* Breadcrumb Navigation */}
        <div className="border-b border-border bg-card/40 py-3">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Link
              href="/videos"
              className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Shoppable Videos</span>
            </Link>
          </div>
        </div>

        {/* Video Player & Info Header */}
        <section className="py-8 sm:py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Terrific Video Embed */}
              <div className="lg:col-span-8">
                <div className="overflow-hidden rounded-2xl p-1 bg-gradient-to-tr from-primary/30 via-accent/20 to-border shadow-xl">
                  <TerrificEmbed
                    embeddingId={video.embeddingId || 'Cki70GhqvLgWGhJbSxg2'}
                    liveShowId={video.id}
                    source="terrific_video"
                    title={video.title}
                    showBadge={true}
                    aspectRatio="video"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Right Column: Video Details & Compliance Info */}
              <div className="lg:col-span-4 flex flex-col space-y-4">
                <div className="flex items-center gap-2">
                  <LiveBadge status={video.status} format="SHOPPABLE_VIDEO" size="md" />
                  {video.brand && (
                    <span className="rounded-md bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground border border-border">
                      {video.brand.name}
                    </span>
                  )}
                </div>

                <h1 className="font-heading text-2xl sm:text-3xl text-foreground font-bold leading-tight">
                  {video.title}
                </h1>

                {video.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {video.description}
                  </p>
                )}

                <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>How Shoppable Video Works</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Tap any pinned cannabis product inside the video or below to instantly lock in exclusive Owtlet pricing and reserve your inventory.
                  </p>
                  <div className="pt-2 border-t border-border flex flex-col space-y-2 text-[11px] text-muted-foreground font-medium">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      <span>21+ Verified · Zero ID / Zero Payment Storage</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span>Automated Pickup & Delivery to NY Coverage ZIPs</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pinned Products Rail */}
            <div className="mt-12">
              <PinnedProductRail
                products={pinnedProducts}
                liveShowId={video.id}
                source="terrific_video"
                title="Featured Products in this Video"
              />
            </div>
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}

