import * as React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/server/db';
import { StoreHeader } from '@/components/layout/store-header';
import { StoreFooter } from '@/components/layout/store-footer';
import { TerrificEmbed } from '@/components/modules/live/TerrificEmbed';
import { ShowRail } from '@/components/modules/live/ShowRail';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, Play, Sparkles, Video, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Live Cannabis Shopping, Replays & Shoppable Videos — Owtlet™',
  description: 'Experience interactive live shows and drops featuring licensed New York craft cannabis cultivators. Watch live, explore replays, or shop on-demand reels.',
};

export const revalidate = 60;

export default async function LiveIndexPage() {
  const allShows = await prisma.liveShow.findMany({
    orderBy: [
      { status: 'asc' }, // LIVE sorts first
      { scheduledAt: 'desc' },
      { createdAt: 'desc' },
    ],
    include: {
      brand: true,
      products: {
        orderBy: { sortOrder: 'asc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              owtletPrice: true,
            },
          },
        },
      },
    },
  });

  const featuredLive = allShows.find((s) => s.status === 'LIVE' && s.format === 'LIVE_SHOW') || allShows[0];

  const upcomingShows = allShows
    .filter((s) => s.status === 'SCHEDULED' && s.format === 'LIVE_SHOW')
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

  const replayShows = allShows
    .filter((s) => s.status === 'REPLAY' && s.format === 'LIVE_SHOW')
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

  const shoppableVideos = allShows
    .filter((s) => s.format === 'SHOPPABLE_VIDEO')
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

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <StoreHeader />

      <main className="flex-1 pb-16">
        {/* Hero Section with Featured Live Player */}
        <section className="border-b border-border bg-gradient-to-b from-card/80 to-background py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent font-semibold text-xs uppercase mb-3">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                <span>Featured Live Experience</span>
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl text-foreground">
                Owtlet™ Live Drops & Replays
              </h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                Watch licensed NY growers and extract artists live. Tap pinned products to hold them in your cart at exclusive show prices.
              </p>
            </div>

            {featuredLive ? (
              <div className="rounded-2xl p-1 bg-gradient-to-tr from-primary/30 via-accent/20 to-border shadow-xl">
                <TerrificEmbed
                  embeddingId={featuredLive.embeddingId}
                  liveShowId={featuredLive.id}
                  source={featuredLive.status === 'REPLAY' ? 'terrific_replay' : 'terrific_live'}
                  title={featuredLive.title}
                  showBadge={true}
                  aspectRatio="video"
                  className="w-full"
                />
              </div>
            ) : null}
          </div>
        </section>

        {/* Rails Container */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 py-10">
          {/* Upcoming Live Drops */}
          {upcomingShows.length > 0 && (
            <ShowRail
              title="Upcoming Live Drops"
              description="Scheduled cultivator broadcasts and fresh harvest product releases."
              badgeText="Upcoming Schedule"
              badgeIcon="live"
              shows={upcomingShows}
            />
          )}

          {/* Replays Vault */}
          <ShowRail
            title="Replay Vault"
            description="Missed a live broadcast? Rewatch cultivator sessions and tap products to buy at recorded drop prices."
            badgeText="Drop Replays"
            badgeIcon="replay"
            shows={replayShows}
            emptyTitle="No Replays Yet"
            emptyDescription="Recordings of our live broadcasts will appear here after each show concludes."
          />

          {/* Shoppable Video Reels */}
          <ShowRail
            title="Shoppable Video Reels"
            description="Bite-sized cultivator overviews, strain highlights, and tap-to-cart reels."
            badgeText="On-Demand Reels"
            badgeIcon="video"
            shows={shoppableVideos}
            viewAllHref="/videos"
            viewAllText="Explore All Videos"
            emptyTitle="No Shoppable Videos Yet"
            emptyDescription="Explore our live show broadcast schedule or visit the full catalog."
          />
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}
