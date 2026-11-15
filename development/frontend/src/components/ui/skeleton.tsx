import * as React from 'react';
import { cn } from '../../lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-label="Loading..."
      className={cn(
        'animate-pulse rounded-md bg-owtlet-sage/30 dark:bg-owtlet-ink/60 border border-border/40',
        className
      )}
      {...props}
    />
  );
}
