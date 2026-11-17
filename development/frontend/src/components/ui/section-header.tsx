import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SectionHeaderProps {
  title: string;
  description?: string;
  /** Optional "see all" link rendered on the right. */
  action?: { href: string; label: string };
  /** Optional custom right-hand slot (e.g. carousel arrows). Overrides `action`. */
  aside?: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}

export function SectionHeader({
  title,
  description,
  action,
  aside,
  as: Heading = 'h2',
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-4', className)}>
      <div>
        <Heading className="font-heading text-[clamp(24px,3vw,34px)] leading-[1.08] tracking-[-0.01em] text-foreground text-balance">
          {title}
        </Heading>
        {description ? (
          <p className="mt-1.5 max-w-[56ch] text-[15px] text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {aside ??
        (action ? (
          <Link
            href={action.href}
            className="group inline-flex items-center gap-1.5 border-b-2 border-primary pb-0.5 text-sm font-bold text-foreground transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          >
            {action.label}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : null)}
    </div>
  );
}
