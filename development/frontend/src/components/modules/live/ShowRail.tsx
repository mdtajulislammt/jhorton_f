import * as React from 'react';
import Link from 'next/link';
import { ShowCard, ShowCardProps } from './ShowCard';
import { ShowRailSkeleton } from './LiveShowSkeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight, Video, Radio, Play, Sparkles } from 'lucide-react';

export interface ShowRailProps {
  title: string;
  description?: string;
  badgeText?: string;
  badgeIcon?: 'live' | 'replay' | 'video';
  shows: ShowCardProps[];
  viewAllHref?: string;
  viewAllText?: string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function ShowRail({
  title,
  description,
  badgeText,
  badgeIcon = 'live',
  shows = [],
  viewAllHref,
  viewAllText = 'View All',
  isLoading = false,
  emptyTitle = 'No broadcasts available',
  emptyDescription = 'Check back shortly for upcoming craft cannabis drops and live cultivator sessions.',
  className = '',
}: ShowRailProps) {
  if (isLoading) {
    return <ShowRailSkeleton count={3} />;
  }

  const renderBadgeIcon = () => {
    switch (badgeIcon) {
      case 'live':
        return <Radio className="h-3.5 w-3.5 animate-pulse" />;
      case 'video':
        return <Sparkles className="h-3.5 w-3.5" />;
      case 'replay':
        return <Play className="h-3.5 w-3.5 fill-current" />;
      default:
        return null;
    }
  };

  return (
    <section className={`py-8 ${className}`}>
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
        <div>
          {badgeText && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent font-semibold text-xs tracking-wide uppercase mb-2">
              {renderBadgeIcon()}
              <span>{badgeText}</span>
            </div>
          )}
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {viewAllHref && shows.length > 0 && (
          <Link
            href={viewAllHref}
            className="inline-flex items-center text-sm font-semibold text-primary hover:underline group"
          >
            <span>{viewAllText}</span>
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      {/* Shows Grid or Empty State */}
      {shows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shows.map((show) => (
            <ShowCard key={show.id} {...show} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center bg-card/50">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
            <Video className="h-6 w-6" />
          </div>
          <h3 className="font-heading text-base font-bold text-foreground">
            {emptyTitle}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
            {emptyDescription}
          </p>
          <div className="mt-4">
            <Link href="/shop">
              <Button size="sm" variant="outline" className="min-h-[44px] px-4 font-bold">
                Browse Full Cannabis Catalog
              </Button>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

