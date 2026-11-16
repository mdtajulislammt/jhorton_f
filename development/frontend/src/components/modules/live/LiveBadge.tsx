import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Radio, Play, Clock, Video } from 'lucide-react';
import { ShowStatus, VideoFormat } from '@prisma/client';

export interface LiveBadgeProps {
  status?: ShowStatus | 'SCHEDULED' | 'LIVE' | 'REPLAY' | 'ARCHIVED';
  format?: VideoFormat | 'LIVE_SHOW' | 'SHOPPABLE_VIDEO';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LiveBadge({
  status = 'SCHEDULED',
  format = 'LIVE_SHOW',
  className = '',
  size = 'md',
}: LiveBadgeProps) {
  const isLive = status === 'LIVE';
  const isReplay = status === 'REPLAY';
  const isVideo = format === 'SHOPPABLE_VIDEO';

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  }[size];

  if (isLive) {
    return (
      <Badge
        className={`bg-accent text-accent-foreground font-bold uppercase tracking-wider animate-pulse flex items-center gap-1.5 shadow-sm border border-accent/40 ${sizeClasses} ${className}`}
      >
        <Radio className="h-3 w-3 animate-ping" />
        <span>LIVE NOW</span>
      </Badge>
    );
  }

  if (isVideo) {
    return (
      <Badge
        variant="secondary"
        className={`bg-primary/20 text-foreground font-semibold uppercase tracking-wider flex items-center gap-1 border border-primary/30 ${sizeClasses} ${className}`}
      >
        <Video className="h-3 w-3 text-primary" />
        <span>SHOPPABLE VIDEO</span>
      </Badge>
    );
  }

  if (isReplay) {
    return (
      <Badge
        variant="outline"
        className={`bg-card/90 text-foreground/90 font-semibold uppercase tracking-wider flex items-center gap-1 border-border/80 ${sizeClasses} ${className}`}
      >
        <Play className="h-3 w-3 fill-current opacity-70" />
        <span>REPLAY AVAILABLE</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={`bg-muted/80 text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1 border-border ${sizeClasses} ${className}`}
    >
      <Clock className="h-3 w-3" />
      <span>UPCOMING DROP</span>
    </Badge>
  );
}

