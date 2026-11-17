'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, Play, ShoppingBag } from 'lucide-react';
import { LiveBadge } from './LiveBadge';
import { showFallbackPhoto } from '@/lib/brand-photos';
import { FallbackImage } from '@/components/ui/fallback-image';
import { cn } from '@/lib/utils';

export interface ShowCardProductPreview {
  productId: string;
  name: string;
  owtletPrice?: string | null;
}

export interface ShowCardProps {
  id: string;
  title: string;
  description?: string | null;
  format?: 'LIVE_SHOW' | 'SHOPPABLE_VIDEO';
  status?: 'SCHEDULED' | 'LIVE' | 'REPLAY' | 'ARCHIVED';
  scheduledAt?: string | null;
  endedAt?: string | null;
  thumbnailUrl?: string | null;
  brand?: {
    slug: string;
    name: string;
  } | null;
  products?: ShowCardProductPreview[];
  className?: string;
}

export function ShowCard({
  id,
  title,
  description,
  format = 'LIVE_SHOW',
  status = 'SCHEDULED',
  scheduledAt,
  endedAt,
  thumbnailUrl,
  brand,
  products = [],
  className = '',
}: ShowCardProps) {
  const isLive = status === 'LIVE';
  const isVideo = format === 'SHOPPABLE_VIDEO';
  const href = isVideo ? `/videos/${id}` : `/live/${id}`;

  const fallback = showFallbackPhoto(id);

  const formattedDate = React.useMemo(() => {
    if (isLive) return 'Broadcasting now';
    const targetDate = scheduledAt ? new Date(scheduledAt) : endedAt ? new Date(endedAt) : null;
    if (!targetDate || isNaN(targetDate.getTime())) return null;
    try {
      return (
        targetDate.toLocaleDateString('en-US', {
          timeZone: 'America/New_York',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }) + ' ET'
      );
    } catch {
      return null;
    }
  }, [isLive, scheduledAt, endedAt]);

  const ctaLabel = isLive ? 'Watch Live' : isVideo ? 'Shop Video' : 'Watch Replay';

  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col gap-3 rounded-[18px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4',
        className
      )}
    >
      {/* Photo */}
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-[18px] bg-ink',
          isVideo ? 'aspect-[9/13]' : 'aspect-[4/3]'
        )}
      >
        <FallbackImage
          src={thumbnailUrl}
          fallback={fallback}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06] motion-reduce:group-hover:scale-100"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-owtlet-night/50 via-transparent to-owtlet-night/70"
        />

        <div className="absolute left-3 top-3 z-10">
          <LiveBadge status={status} format={format} size="sm" />
        </div>

        <span
          aria-hidden="true"
          className="absolute inset-0 z-10 m-auto grid h-14 w-14 scale-90 place-items-center rounded-full bg-owtlet-mist/90 text-owtlet-ink opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"
        >
          <Play className="ml-0.5 h-5 w-5 fill-current" />
        </span>

        {products.length > 0 && (
          <div className="absolute inset-x-3 bottom-3 z-10 flex translate-y-1 items-center justify-between gap-2 rounded-xl bg-owtlet-mist/95 px-3 py-2 text-xs font-bold text-owtlet-ink opacity-95 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="flex items-center gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5" />
              {products.length} Pinned {products.length === 1 ? 'Product' : 'Products'}
            </span>
            {products[0]?.owtletPrice ? (
              <span className="font-mono tabular-nums">from ${products[0].owtletPrice}</span>
            ) : null}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-col gap-1 px-0.5">
        <span className="text-xs font-semibold text-muted">{brand?.name ?? 'Owtlet Live'}</span>
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground">{title}</h3>
        {description ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
        <div className="mt-1 flex items-center justify-between gap-2 text-xs">
          {formattedDate ? (
            <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formattedDate}
            </span>
          ) : (
            <span />
          )}
          <span className="inline-flex min-h-[44px] items-center gap-1 font-bold text-foreground">
            {ctaLabel}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
