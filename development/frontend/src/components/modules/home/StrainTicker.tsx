import * as React from 'react';
import { cn } from '@/lib/utils';
import { strainLabel } from '@/components/ui/strain-badge';

export interface StrainTickerItem {
  key: string;
  name: string;
  type: string | null;
  detail: string | null;
}

const LEAF_COLOR: Record<string, string> = {
  SATIVA: 'text-strain-sativa',
  HYBRID: 'text-primary',
  INDICA: 'text-secondary',
  CBD: 'text-secondary',
};

function Leaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={cn('h-[15px] w-[15px] shrink-0', className)} aria-hidden="true">
      <g fill="currentColor">
        <ellipse cx="10" cy="6.5" rx="1.9" ry="6" />
        <ellipse cx="10" cy="7" rx="1.6" ry="5.2" transform="rotate(-40 10 13)" />
        <ellipse cx="10" cy="7" rx="1.6" ry="5.2" transform="rotate(40 10 13)" />
        <ellipse cx="10" cy="9" rx="1.2" ry="3.8" transform="rotate(-78 10 13)" />
        <ellipse cx="10" cy="9" rx="1.2" ry="3.8" transform="rotate(78 10 13)" />
      </g>
      <path d="M10 13v6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

/** Scrolling strip of strains pinned in tonight's shows. Static when reduced motion is requested. */
export function StrainTicker({ items }: { items: StrainTickerItem[] }) {
  if (items.length === 0) return null;

  // Repeat short lists so one copy is wider than the viewport, then duplicate for a seamless loop.
  const base = Array.from({ length: Math.max(1, Math.ceil(6 / items.length)) }, () => items).flat();
  const loop = [...base, ...base];

  return (
    <div className="dark overflow-hidden border-b border-border bg-owtlet-night/95 text-muted-foreground" aria-label="Strains in tonight's shows">
      <div className="flex w-max gap-9 py-3 motion-safe:animate-marquee hover:[animation-play-state:paused]">
        {loop.map((item, i) => (
          <span
            key={`${item.key}-${i}`}
            aria-hidden={i >= base.length || undefined}
            className="inline-flex items-center gap-2.5 whitespace-nowrap font-mono text-[12.5px]"
          >
            <Leaf className={(item.type && LEAF_COLOR[item.type]) || 'text-primary'} />
            <b className="font-bold text-foreground">{item.name}</b>
            {[item.type ? strainLabel(item.type) : null, item.detail].filter(Boolean).join(' · ')}
          </span>
        ))}
      </div>
    </div>
  );
}
