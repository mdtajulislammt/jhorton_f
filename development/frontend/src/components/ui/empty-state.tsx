import * as React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '../../lib/utils';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center sm:p-12',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/50 text-foreground ring-1 ring-border shadow-sm">
          <Icon className="h-7 w-7 text-owtlet-ink dark:text-owtlet-mint" />
        </div>
      )}

      <h3 className="font-heading text-lg sm:text-xl font-normal tracking-tight text-foreground">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>

      {action && (
        <div className="mt-6">
          {action.href ? (
            <Link href={action.href}>
              <Button size="default" className="shadow-md">
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button size="default" onClick={action.onClick} className="shadow-md">
              {action.label}
            </Button>
          )}
        </div>
      )}

      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

