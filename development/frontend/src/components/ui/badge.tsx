import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'live'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'warning'
    | 'replay'
    | 'upcoming';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variantStyles = {
    // Mint bg, Ink text (WCAG 2.2 AA compliant ~12:1 contrast)
    default:
      'border-transparent bg-primary text-primary-foreground',
    // Sage bg, Ink text
    secondary:
      'border-transparent bg-secondary text-secondary-foreground',
    // Owtlet LIVE Ember badge with white bold text (matches Terrific live streams)
    live:
      'border-transparent bg-accent text-white font-bold tracking-wide uppercase shadow-sm',
    destructive:
      'border-transparent bg-danger text-white',
    outline:
      'border-border text-foreground bg-transparent',
    success:
      'border-transparent bg-success text-white',
    warning:
      'border-transparent bg-warning text-owtlet-ink',
    // Recorded show — Ink chip
    replay:
      'border-transparent bg-ink text-owtlet-mist font-bold tracking-wide uppercase',
    // Scheduled show — Volt chip
    upcoming:
      'border-transparent bg-strain-sativa text-owtlet-ink font-bold tracking-wide uppercase',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {variant === 'live' && (
        <span
          data-testid="live-indicator-dot"
          className="mr-1.5 h-1.5 w-1.5 rounded-full bg-white animate-pulse"
        />
      )}
      {children}
    </div>
  );
}
