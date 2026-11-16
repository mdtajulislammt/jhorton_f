'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LiveBadge } from './LiveBadge';
import { Button } from '@/components/ui/button';
import { Play, Radio, ShoppingBag, Clock, Sparkles } from 'lucide-react';

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
  const isReplay = status === 'REPLAY';

  const href = isVideo ? `/videos/${id}` : `/live/${id}`;

  const formattedDate = React.useMemo(() => {
    if (isLive) return 'Broadcasting Now';
    const targetDate = scheduledAt ? new Date(scheduledAt) : endedAt ? new Date(endedAt) : null;
    if (!targetDate || isNaN(targetDate.getTime())) return null;

    try {
      return targetDate.toLocaleDateString('en-US', {
        timeZone: 'America/New_York',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }) + ' EST';
    } catch {
      return null;
    }
  }, [isLive, scheduledAt, endedAt]);

  return (
    <div
      className={`group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md ${className}`}
    >
      {/* Top Media / Thumbnail Container */}
      <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-xl bg-gradient-to-tr from-card via-muted to-primary/10 border border-border/60">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary shadow-sm mb-2 group-hover:scale-110 transition-transform">
              {isLive ? (
                <Radio className="h-6 w-6 animate-pulse" />
              ) : isVideo ? (
                <Sparkles className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 fill-current ml-0.5" />
              )}
            </div>
            <span className="font-heading text-xs tracking-wide text-foreground/80 line-clamp-1">
              {brand?.name || 'Owtlet™ Drops'}
            </span>
          </div>
        )}

        {/* Status Badge Overlay */}
        <div className="absolute top-3 left-3 z-10">
          <LiveBadge status={status} format={format} size="sm" />
        </div>

        {/* Brand Tag Top Right */}
        {brand && (
          <div className="absolute top-3 right-3 z-10">
            <span className="rounded-md bg-background/85 backdrop-blur-sm px-2 py-0.5 text-[11px] font-semibold text-foreground/90 border border-border/80 shadow-xs">
              {brand.name}
            </span>
          </div>
        )}
      </div>

      {/* Title & Metadata */}
      <div className="flex flex-1 flex-col">
        <h3 className="font-heading text-lg font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {description ? (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>
        ) : null}

        {/* Pinned Products Preview */}
        {products.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <ShoppingBag className="h-3 w-3 text-primary" />
              {products.length} Pinned {products.length === 1 ? 'Product' : 'Products'}:
            </span>
            {products.slice(0, 2).map((p) => (
              <span
                key={p.productId}
                className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-foreground border border-border/40"
              >
                {p.name}
                {p.owtletPrice ? ` · $${p.owtletPrice}` : ''}
              </span>
            ))}
            {products.length > 2 && (
              <span className="text-[10px] font-medium text-muted-foreground">
                +{products.length - 2} more
              </span>
            )}
          </div>
        )}

        {/* Footer: Date & CTA */}
        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {formattedDate && (
              <>
                <Clock className="h-3.5 w-3.5" />
                <span className="font-medium text-[11px]">{formattedDate}</span>
              </>
            )}
          </div>

          <Link href={href}>
            <Button
              size="sm"
              className={`min-h-[44px] px-4 font-bold active:scale-[0.98] ${
                isLive
                  ? 'bg-primary text-primary-foreground hover:bg-owtlet-volt shadow-sm'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              {isLive ? (
                <>
                  <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                  Watch Live
                </>
              ) : isVideo ? (
                <>
                  <ShoppingBag className="mr-1.5 h-3.5 w-3.5" />
                  Shop Video
                </>
              ) : (
                <>
                  <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                  Watch Replay
                </>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

