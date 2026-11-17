import * as React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/server/db';
import { StoreHeader } from '@/components/layout/store-header';
import { StoreFooter } from '@/components/layout/store-footer';
import { ShowCard } from '@/components/modules/live/ShowCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Video, Sparkles, ShoppingBag, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shoppable Cannabis Videos & Product Reels — Owtlet™',
  description: 'Watch interactive shoppable video reels featuring New York licensed craft cannabis cultivators. Tap in-video items to add directly to your cart.',
};

export const revalidate = 60;

export default async function VideosIndexPage() {
  const videos = await prisma.liveShow.findMany({
    where: {
      format: 'SHOPPABLE_VIDEO',
    },
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

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <StoreHeader />

      <main className="flex-1 pb-16">
        {/* Header Hero */}
        <section className="border-b border-border bg-gradient-to-b from-card/80 to-background py-10">
          <div className="mx-auto max-w-content px-4 sm:px-7">
            <div className="flex flex-col items-start mb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary font-semibold text-xs uppercase mb-3">
                <Sparkles className="h-3.5 w-3.5" />
                <span>On-Demand Shoppable Reels</span>
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl text-foreground">
                Shoppable Video Vault
              </h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                Explore short-form craft cannabis videos, master cultivator overviews, and live strain reviews. Tap any pinned item to add directly to your cart with exclusive show pricing.
              </p>
            </div>
          </div>
        </section>

        {/* Video Grid Section */}
        <section className="py-12">
          <div className="mx-auto max-w-content px-4 sm:px-7">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <span className="font-heading text-xl text-foreground">
                  All Shoppable Videos
                </span>
                <Badge variant="outline" className="text-xs font-semibold">
                  {videos.length} {videos.length === 1 ? 'Video' : 'Videos'}
                </Badge>
              </div>

              <Link href="/live">
                <Button variant="ghost" size="sm" className="text-xs font-semibold">
                  Switch to Live Shows →
                </Button>
              </Link>
            </div>

            {videos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((v) => (
                  <ShowCard
                    key={v.id}
                    id={v.id}
                    title={v.title}
                    description={v.description}
                    format="SHOPPABLE_VIDEO"
                    status={v.status}
                    scheduledAt={v.scheduledAt ? v.scheduledAt.toISOString() : null}
                    endedAt={v.endedAt ? v.endedAt.toISOString() : null}
                    thumbnailUrl={v.thumbnailUrl}
                    brand={v.brand ? { slug: v.brand.slug, name: v.brand.name } : null}
                    products={v.products.map((p) => ({
                      productId: p.product.id,
                      name: p.product.name,
                      owtletPrice: p.product.owtletPrice ? String(p.product.owtletPrice) : null,
                    }))}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card/40">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                  <Video className="h-7 w-7" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  No Shoppable Videos Yet
                </h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                  Our New York cultivator team is preparing fresh on-demand video drops. In the meantime, catch our live broadcast schedule or browse the catalog.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link href="/live">
                    <Button className="font-bold min-h-[44px] px-5">
                      View Live Shows
                    </Button>
                  </Link>
                  <Link href="/shop">
                    <Button variant="outline" className="font-bold min-h-[44px] px-5">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Browse Full Catalog
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}

