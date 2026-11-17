import * as React from 'react';
import { cn } from '../../lib/utils';

export type StrainKind = 'SATIVA' | 'INDICA' | 'HYBRID' | 'CBD' | string;

const STRAIN_STYLES: Record<string, string> = {
  SATIVA: 'bg-strain-sativa text-strain-sativa-foreground',
  HYBRID: 'bg-strain-hybrid text-strain-hybrid-foreground',
  INDICA: 'bg-strain-indica text-strain-indica-foreground',
  CBD: 'bg-strain-cbd text-strain-cbd-foreground',
};

/** Soft background used behind product photography, keyed by strain type. */
export const STRAIN_TINTS: Record<string, string> = {
  SATIVA: 'bg-strain-sativa-tint',
  HYBRID: 'bg-strain-hybrid-tint',
  INDICA: 'bg-strain-indica-tint',
  CBD: 'bg-strain-cbd-tint',
};

export function strainTint(type?: string | null): string {
  return (type && STRAIN_TINTS[type]) || 'bg-surface-muted';
}

export function strainLabel(type?: string | null): string {
  if (!type) return '';
  if (type === 'CBD') return 'CBD';
  return type.charAt(0) + type.slice(1).toLowerCase();
}

export interface StrainBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  type: StrainKind;
}

export function StrainBadge({ type, className, children, ...props }: StrainBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide',
        STRAIN_STYLES[type] ?? 'bg-surface-muted text-foreground',
        className
      )}
      {...props}
    >
      {children ?? strainLabel(type)}
    </span>
  );
}
