'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Play, Video } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { FallbackImage } from '@/components/ui/fallback-image';
import { showFallbackPhoto } from '@/lib/brand-photos';
import { cn } from '@/lib/utils';

export interface ReelItem {
  id: string;
  title: string;
  format: string;
  status: string;
  thumbnailUrl: string | null;
  brand: { slug: string; name: string } | null;
  products: { productId: string }[];
}

/** "Replays & Shoppable Videos" reel (design v3 `.reel` / `.vc`): snap-scrolling 9:14 cards with arrow controls. */
export function VideoReel({ items }: { items: ReelItem[] }) {
  const reelRef = React.useRef<HTMLDivElement>(null);

  const scrollBy = (dir: -1 | 1) => {
    const el = reelRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const arrowCls =
    'grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40';

  return (
    <section className="mx-auto max-w-content px-4 pb-14 sm:px-7 lg:pb-[60px]" aria-labelledby="reel-heading">
      <SectionHeader
        title="Replays & Shoppable Videos"
        description="Missed a show? Watch the replay and shop every product pinned in it."
        aside={
          <div className="flex gap-2">
            <button type="button" aria-label="Previous videos" onClick={() => scrollBy(-1)} disabled={items.length === 0} className={arrowCls}>
              <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
            </button>
            <button type="button" aria-label="Next videos" onClick={() => scrollBy(1)} disabled={items.length === 0} className={arrowCls}>
              <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </div>
        }
      />

      {items.length === 0 ? (
        <div className="flex flex-col items-start gap-2.5 rounded-[18px] border-[1.5px] border-dashed border-secondary bg-card p-[22px]">
          <Video className="h-6 w-6 text-muted" aria-hidden="true" />
          <strong className="text-[15px] text-foreground">Replays land here after each show</strong>
          <p className="text-[13px] text-muted-foreground">
            Every Live Show is saved as a shoppable replay. Watch tonight&apos;s show live in the meantime.
          </p>
          <Link
            href="/live"
            className="inline-flex items-center gap-1.5 border-b-2 border-primary pb-0.5 text-sm font-bold text-foreground hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            See the live schedule <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div
          ref={reelRef}
          className="grid snap-x snap-mandatory auto-cols-[minmax(200px,1fr)] grid-flow-col gap-3.5 overflow-x-auto pb-1.5 [scrollbar-width:thin]"
        >
          {items.map((item) => {
            const isVideo = item.format === 'SHOPPABLE_VIDEO';
            const href = isVideo ? `/videos/${item.id}` : `/live/${item.id}`;
            const count = item.products.length;
            return (
              <Link
                key={item.id}
                href={href}
                className="group flex snap-start flex-col gap-2.5 rounded-[18px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div className="relative aspect-[9/14] overflow-hidden rounded-[18px] bg-ink transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:group-hover:scale-100">
                  <FallbackImage
                    src={item.thumbnailUrl}
                    fallback={showFallbackPhoto(item.id)}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[600ms] group-hover:scale-[1.06] motion-reduce:group-hover:scale-100"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-b from-owtlet-night/45 via-transparent via-45% to-owtlet-night/55"
                  />
                  <span
                    className={cn(
                      'absolute left-2.5 top-2.5 z-[1] rounded-full px-[9px] py-1 text-[10.5px] font-bold tracking-[0.08em]',
                      isVideo ? 'bg-owtlet-mist text-owtlet-ink' : 'bg-ink text-owtlet-mist'
                    )}
                  >
                    {isVideo ? 'VIDEO' : 'REPLAY'}
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 z-[1] m-auto grid h-[52px] w-[52px] scale-[.85] place-items-center rounded-full bg-owtlet-mist/90 text-owtlet-ink opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"
                  >
                    <Play className="h-5 w-5 fill-current" />
                  </span>
                  <span className="absolute inset-x-2.5 bottom-2.5 z-[1] flex translate-y-1 items-center justify-between rounded-xl bg-owtlet-mist/95 px-2.5 py-2 text-[12.5px] font-bold text-owtlet-ink opacity-90 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    {count} product{count === 1 ? '' : 's'}
                    <span>Shop →</span>
                  </span>
                </div>
                {item.brand ? <small className="text-[12.5px] text-muted">{item.brand.name}</small> : null}
                <strong className="text-[14.5px] leading-[1.3] text-foreground">{item.title}</strong>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
