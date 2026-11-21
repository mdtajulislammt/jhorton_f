'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { StrainBadge, strainLabel } from '@/components/ui/strain-badge';
import { FallbackImage } from '@/components/ui/fallback-image';
import { BRAND_PHOTOS, categoryPhoto } from '@/lib/brand-photos';
import { cn, formatPct } from '@/lib/utils';
import type { ProductSummaryDto } from '@/types/api.generated';

export interface HomeHeroShow {
  id: string;
  title: string;
  status: string;
  brandName: string | null;
  startedAt: string | null;
  scheduledAt: string | null;
}

export interface HomeHeroProps {
  show: HomeHeroShow | null;
  featured: ProductSummaryDto | null;
  pinnedCount: number;
}

function relativeStart(show: HomeHeroShow): string {
  if (show.status === 'LIVE' && show.startedAt) {
    const mins = Math.max(1, Math.round((Date.now() - new Date(show.startedAt).getTime()) / 60000));
    return mins < 60 ? `started ${mins} min ago` : 'on air now';
  }
  if (show.scheduledAt) {
    return new Date(show.scheduledAt).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }) + ' ET';
  }
  return 'on air soon';
}

export function HomeHero({ show, featured, pinnedCount }: HomeHeroProps) {
  const { addToCart } = useCart();
  const [addState, setAddState] = React.useState<'idle' | 'adding' | 'added'>('idle');
  const [startLabel, setStartLabel] = React.useState<string | null>(null);
  const isLive = show?.status === 'LIVE';
  const price = featured ? featured.owtletPrice ?? featured.fromPrice : null;

  // Relative time depends on the viewer's clock; compute after mount.
  React.useEffect(() => {
    if (show) setStartLabel(relativeStart(show));
  }, [show]);

  const handleAdd = async () => {
    if (!featured || addState === 'adding') return;
    setAddState('adding');
    try {
      await addToCart({ productId: featured.id, source: 'catalog', liveShowId: show?.id });
      setAddState('added');
    } catch {
      setAddState('idle');
    }
  };

  return (
    <section className="dark relative isolate overflow-hidden bg-background text-foreground">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND_PHOTOS.heroCanopy}
        alt=""
        className="absolute inset-0 -z-20 h-full w-full scale-105 object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-owtlet-ink via-owtlet-ink/90 to-owtlet-ink/40"
      />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-owtlet-ink to-transparent" />

      <div className="mx-auto grid max-w-content items-center gap-12 px-4 py-14 sm:px-7 lg:grid-cols-2 lg:pb-[76px] lg:pt-16">
        {/* Copy */}
        <div>
          <span className="inline-flex items-center gap-2.5 font-mono text-xs font-bold tracking-[0.14em] text-strain-sativa">
            <span className="h-2 w-2 rounded-full bg-accent motion-safe:animate-live-ring" aria-hidden="true" />
            {isLive ? 'ON AIR NOW' : 'LIVE EVERY NIGHT'} · LICENSED NEW YORK CANNABIS
          </span>
          <h1 className="my-[18px] font-heading text-[clamp(36px,5.2vw,62px)] leading-[0.98] tracking-[-0.02em] text-balance">
            Fresh flower,
            <br />
            shopped <span className="text-primary">live.</span>
          </h1>
          <p className="max-w-[44ch] text-[17px] leading-relaxed text-muted-foreground">
            Licensed New York growers and brands go live every night. Tap a pinned strain and it&apos;s in your
            Cart at the Owtlet Price, ready for pickup or delivery.
          </p>
          <div className="mt-[26px] flex flex-wrap gap-3">
            <Link href={show ? `/live/${show.id}` : '/live'}>
              <Button className="group h-auto px-[22px] py-[13px] text-[14.5px] font-bold">
                {isLive ? 'Join the live show' : 'See tonight’s shows'}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link href="/shop">
              <Button variant="outline-inverse" className="h-auto border-[1.5px] px-[22px] py-[13px] text-[14.5px] font-bold">
                Browse the shop
              </Button>
            </Link>
          </div>
          <dl className="mt-7 flex flex-wrap gap-x-[18px] gap-y-3 border-t border-border pt-5 text-[13px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <dt className="font-mono font-bold text-foreground">1</dt>
              <dd>price at every store</dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="font-mono font-bold text-foreground">30:00</dt>
              <dd>cart hold after the show</dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="font-mono font-bold text-foreground">21+</dt>
              <dd>ID check at the dispensary</dd>
            </div>
          </dl>
        </div>

        {/* Feature photo */}
        <div className="group relative mx-auto w-full max-w-[480px] lg:mr-0">
          <div className="relative aspect-[4/4.7] overflow-hidden rounded-[28px] border border-border shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRAND_PHOTOS.heroBud}
              alt="Close-up of a frosty cannabis bud with orange pistils"
              className="h-full w-full object-cover transition-transform duration-[5000ms] ease-out group-hover:scale-[1.07] motion-reduce:group-hover:scale-100"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-owtlet-night/50 via-transparent to-owtlet-night/85" />

            <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold tracking-[0.08em]',
                  isLive ? 'bg-accent text-accent-foreground' : 'bg-strain-sativa text-owtlet-ink'
                )}
              >
                {isLive ? <span className="h-1.5 w-1.5 rounded-full bg-accent-foreground" aria-hidden="true" /> : null}
                {isLive ? 'LIVE NOW' : 'UP NEXT'}
              </span>
              {pinnedCount > 0 ? (
                <span className="rounded-full bg-owtlet-night/55 px-2.5 py-1 text-[10.5px] font-bold text-owtlet-mist backdrop-blur">
                  {pinnedCount} product{pinnedCount === 1 ? '' : 's'} pinned
                </span>
              ) : null}
            </div>

            {show ? (
              <div className="absolute inset-x-5 bottom-[104px]">
                <strong className="block text-lg leading-tight">{show.title}</strong>
                <span className="text-xs text-muted-foreground">
                  {show.brandName ?? 'Owtlet Live'}
                  {startLabel ? ` · ${startLabel}` : ''}
                </span>
              </div>
            ) : null}

            {featured ? (
              <div className="absolute inset-x-3 bottom-3 grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-2xl border border-border bg-owtlet-ink/60 p-2 backdrop-blur-md">
                <FallbackImage
                  src={featured.imageUrls?.[0]}
                  fallback={categoryPhoto(featured.category.slug)}
                  className="h-11 w-11 rounded-[10px] object-cover"
                />
                <Link href={`/product/${featured.slug}`} className="min-w-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <strong className="block text-sm leading-[1.25]">{featured.name}</strong>
                  <span className="block font-mono text-xs text-muted">
                    {[featured.strain ? strainLabel(featured.strain.type) : null, featured.thcPercent ? `THC ${formatPct(featured.thcPercent)}%` : null, price ? `$${price}` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={addState === 'adding'}
                  aria-label={addState === 'added' ? `${featured.name} is in your Cart` : `Add ${featured.name} to Cart`}
                  className={cn(
                    'inline-flex min-h-[40px] min-w-[88px] items-center justify-center gap-1.5 rounded-full px-[14px] text-[13px] font-bold transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    addState === 'added' ? 'bg-owtlet-mist text-owtlet-ink' : 'bg-primary text-primary-foreground hover:bg-primary-hover'
                  )}
                >
                  {addState === 'adding' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {addState === 'added' ? (
                    <>
                      <Check className="h-4 w-4" /> In Cart
                    </>
                  ) : (
                    'Add'
                  )}
                </button>
              </div>
            ) : null}
          </div>

          {featured?.strain || featured?.thcPercent ? (
            <div className="absolute -right-1.5 top-[16%] flex flex-col gap-1.5 rounded-2xl bg-owtlet-mist px-3.5 py-2.5 text-owtlet-ink shadow-xl motion-safe:animate-float sm:-right-2 lg:-right-6">
              {featured.strain ? <StrainBadge type={featured.strain.type} className="self-start" /> : null}
              {featured.thcPercent ? <b className="font-mono text-[15px]">THC {formatPct(featured.thcPercent)}%</b> : null}
              <small className="text-[11px] text-owtlet-ink/70">
                {[featured.strain?.name ?? featured.category.name, featured.weightGrams ? `${formatPct(featured.weightGrams)}g` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </small>
            </div>
          ) : null}

          {featured?.owtletPrice ? (
            <div className="absolute -left-8 top-[34%] hidden h-[108px] w-[108px] -rotate-[10deg] flex-col place-content-center rounded-full bg-strain-sativa text-center text-[10.5px] font-bold uppercase tracking-[0.06em] text-owtlet-ink shadow-xl transition-transform duration-500 group-hover:rotate-[4deg] sm:grid">
              <span>Owtlet Price</span>
              <b className="font-mono text-[21px] normal-case tracking-normal">${parseFloat(featured.owtletPrice)}</b>
              <span>every store</span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
