import * as React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/server/db';
import { StoreHeader } from '@/components/layout/store-header';
import { StoreFooter } from '@/components/layout/store-footer';
import { TerrificEmbed } from '@/components/modules/live/TerrificEmbed';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, Play, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Live Cannabis Shopping & Replays — Owtlet™',
  description: 'Experience interactive live shows and drops featuring licensed New York craft cannabis cultivators.',
};

export const revalidate = 60;

export default async function LiveIndexPage() {
  const shows = await prisma.liveShow.findMany({
    orderBy: [
      { status: 'asc' }, // LIVE sorts first
      { scheduledAt: 'desc' },
    ],
    include: {
      brand: true,
      products: {
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

  const liveShow = shows.find((s) => s.status === 'LIVE') || shows[0];

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

            {liveShow ? (
              <div className="rounded-2xl p-1 bg-gradient-to-tr from-primary/30 via-accent/20 to-border shadow-xl">
                <TerrificEmbed
                  embeddingId={liveShow.embeddingId}
                  liveShowId={liveShow.id}
                  source={liveShow.status === 'REPLAY' ? 'terrific_replay' : 'terrific_live'}
                  title={liveShow.title}
                  showBadge={true}
                  aspectRatio="video"
                  className="w-full"
                />
              </div>
            ) : null}
          </div>
        </section>

        {/* All Shows & Replays Grid */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading text-2xl text-foreground">
                All Broadcasts & Drops
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shows.map((show) => {
                const isLive = show.status === 'LIVE';
                const isReplay = show.status === 'REPLAY';

                return (
                  <div
                    key={show.id}
                    className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-primary/40 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      {isLive ? (
                        <Badge className="bg-accent text-accent-foreground font-bold text-xs uppercase px-2.5 py-0.5 animate-pulse flex items-center gap-1">
                          <Radio className="h-3 w-3" />
                          LIVE NOW
                        </Badge>
                      ) : isReplay ? (
                        <Badge variant="outline" className="text-xs font-semibold uppercase">
                          REPLAY AVAILABLE
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs font-medium uppercase">
                          UPCOMING
                        </Badge>
                      )}

                      {show.brand && (
                        <span className="text-xs text-muted-foreground font-medium">
                          {show.brand.name}
                        </span>
                      )}
                    </div>

                    <h3 className="font-heading text-lg text-foreground mb-2 line-clamp-1">
                      {show.title}
                    </h3>

                    {show.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                        {show.description}
                      </p>
                    )}

                    <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{show.products.length} Pinned Products</span>
                      </div>

                      <Link href={`/live/${show.id}`}>
                        <Button
                          size="sm"
                          className={
                            isLive
                              ? 'bg-primary text-primary-foreground hover:bg-owtlet-volt font-bold'
                              : 'bg-muted text-foreground hover:bg-muted/80 font-medium'
                          }
                        >
                          {isLive ? (
                            <>
                              <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                              Watch Live
                            </>
                          ) : (
                            'Watch Replay'
                          )}
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}
