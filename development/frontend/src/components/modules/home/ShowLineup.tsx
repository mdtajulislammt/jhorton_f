'use client';

import * as React from 'react';
import Link from 'next/link';
import { SectionHeader } from '@/components/ui/section-header';
import { cn } from '@/lib/utils';

export interface LineupShow {
  id: string;
  title: string;
  status: string;
  brandName: string | null;
  scheduledAt: string | null;
  pinnedCount: number;
}

function timeLabel(iso: string | null) {
  if (!iso) return 'TBA';
  return new Date(iso).toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function countdown(iso: string | null, now: number) {
  if (!iso) return null;
  const diff = Math.floor((new Date(iso).getTime() - now) / 1000);
  if (diff <= 0) return 'starting';
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h >= 24) return `in ${Math.floor(h / 24)}d`;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** "Tonight on Owtlet" — live and scheduled Live Shows on a time rail with live countdowns. */
export function ShowLineup({ shows }: { shows: LineupShow[] }) {
  const [now, setNow] = React.useState<number | null>(null);

  React.useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (shows.length === 0) return null;

  return (
    <section className="mx-auto max-w-content px-4 py-14 sm:px-7 lg:py-[60px]">
      <SectionHeader
        title="Tonight on Owtlet"
        description="Live Show schedule, New York time. Click a show to join or see what will be pinned."
        action={{ href: '/live', label: 'Full schedule' }}
      />
      <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <li
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-[15px] hidden h-0.5 bg-[repeating-linear-gradient(90deg,var(--strain-cbd)_0_6px,transparent_6px_12px)] lg:block"
        />
        {shows.map((show) => {
          const live = show.status === 'LIVE';
          return (
            <li key={show.id} className="relative flex flex-col gap-3">
              <span
                className={cn(
                  'relative z-[1] self-start rounded-full border px-3 py-1.5 font-mono text-xs font-bold',
                  live ? 'border-accent bg-accent text-accent-foreground' : 'border-border bg-background text-foreground'
                )}
              >
                {live ? 'NOW' : timeLabel(show.scheduledAt)}
              </span>
              <Link
                href={`/live/${show.id}`}
                className="flex min-h-[150px] flex-col gap-2 rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-[3px] hover:border-secondary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:hover:translate-y-0"
              >
                <span className="text-xs text-muted">{show.brandName ?? 'Owtlet Live'}</span>
                <strong className="line-clamp-2 text-base leading-snug text-foreground">{show.title}</strong>
                <span className="mt-auto flex items-center justify-between text-xs">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold tracking-[0.08em]',
                      live ? 'bg-accent text-accent-foreground' : 'bg-strain-sativa text-owtlet-ink'
                    )}
                  >
                    {live ? <span className="h-1.5 w-1.5 rounded-full bg-accent-foreground" aria-hidden="true" /> : null}
                    {live ? 'LIVE' : 'UP NEXT'}
                  </span>
                  <span className={cn('text-foreground', live ? 'font-body' : 'font-mono font-bold tabular-nums')}>
                    {live
                      ? `${show.pinnedCount} pinned`
                      : now !== null
                        ? countdown(show.scheduledAt, now)
                        : timeLabel(show.scheduledAt)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
