import * as React from 'react';
import Link from 'next/link';
import { BRAND_PHOTOS } from '@/lib/brand-photos';
import { cn } from '@/lib/utils';

export interface AuthShellProps {
  /** Mono eyebrow above the form title, e.g. "SHOPPER ACCOUNT". */
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
  /** Form card body. */
  children: React.ReactNode;
  /** Small print under the card (links to the other auth pages). */
  footer?: React.ReactNode;
  variant?: 'shopper' | 'admin';
}

const PANEL = {
  shopper: {
    eyebrow: 'LIVE EVERY NIGHT · LICENSED NEW YORK CANNABIS',
    headline: (
      <>
        Fresh flower,
        <br />
        shopped <span className="text-primary">live.</span>
      </>
    ),
    body: 'Save your addresses and default partner store, and track every order from the shows you shop.',
    stats: [
      { value: '1', label: 'price at every store' },
      { value: '30:00', label: 'cart hold after the show' },
      { value: '21+', label: 'ID check at the dispensary' },
    ],
    photo: BRAND_PHOTOS.heroCanopy,
  },
  admin: {
    eyebrow: 'OWTLET OPS & CATALOG CONSOLE',
    headline: (
      <>
        Run the shows,
        <br />
        stores <span className="text-primary">&amp; orders.</span>
      </>
    ),
    body: 'Manage products, inventory, partner dispensaries, brands, Live Shows and orders in one place.',
    stats: [
      { value: '7', label: 'console sections' },
      { value: 'RBAC', label: 'staff roles' },
      { value: 'HMAC', label: 'signed sessions' },
    ],
    photo: BRAND_PHOTOS.plantsCanopy,
  },
} as const;

/** Split auth layout (design v3): photo-backed dark brand panel + form card. */
export function AuthShell({ eyebrow, title, description, children, footer, variant = 'shopper' }: AuthShellProps) {
  const panel = PANEL[variant];

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="dark relative isolate flex flex-col overflow-hidden bg-background text-foreground">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={panel.photo} alt="" className="absolute inset-0 -z-20 h-full w-full scale-105 object-cover" />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-r from-owtlet-ink via-owtlet-ink/90 to-owtlet-ink/55"
        />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-owtlet-ink to-transparent" />

        <div className="flex flex-1 flex-col gap-8 px-5 py-6 sm:px-10 lg:px-14 lg:py-10">
          <Link
            href="/"
            className="self-start rounded font-heading text-[23px] tracking-[-0.01em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Owtlet<sup className="ml-0.5 text-[11px] text-primary">™</sup>
            {variant === 'admin' ? <span className="ml-2 align-middle font-mono text-xs font-bold tracking-[0.14em] text-strain-sativa">ADMIN</span> : null}
          </Link>

          <div className="hidden flex-1 flex-col justify-center lg:flex">
            <span className="inline-flex items-center gap-2.5 font-mono text-xs font-bold tracking-[0.14em] text-strain-sativa">
              <span className="h-2 w-2 rounded-full bg-accent motion-safe:animate-live-ring" aria-hidden="true" />
              {panel.eyebrow}
            </span>
            <p className="my-[18px] font-heading text-[clamp(36px,4.4vw,56px)] leading-[0.98] tracking-[-0.02em] text-balance">
              {panel.headline}
            </p>
            <p className="max-w-[44ch] text-[17px] leading-relaxed text-muted-foreground">{panel.body}</p>
            <dl className="mt-7 flex flex-wrap gap-x-[18px] gap-y-3 border-t border-border pt-5 text-[13px] text-muted-foreground">
              {panel.stats.map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <dt className="font-mono font-bold text-foreground">{s.value}</dt>
                  <dd>{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <p className="hidden text-xs text-muted lg:block">
            For adults 21 and older. Every cannabis product is sold, ID-checked and fulfilled by a New York State licensed
            dispensary.
          </p>
        </div>
      </aside>

      {/* Form */}
      <main className="flex items-start justify-center px-4 py-10 sm:px-7 lg:items-center lg:py-14">
        <div className="w-full max-w-[440px]">
          <span className="font-mono text-xs font-bold tracking-[0.14em] text-success">{eyebrow}</span>
          <h1 className="mt-2 font-heading text-[clamp(26px,3vw,34px)] leading-[1.08] tracking-[-0.01em] text-foreground text-balance">
            {title}
          </h1>
          {description ? <p className="mt-2 text-[15px] text-muted-foreground">{description}</p> : null}

          <div className={cn('mt-6 rounded-[20px] border border-border bg-card p-5 shadow-sm sm:p-[26px]')}>{children}</div>

          {footer ? <div className="mt-5 space-y-2 text-center text-sm text-muted-foreground">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}

/** Shared field styles for auth forms (design v3 ZIP field). */
export const authLabel = 'mb-1.5 block text-sm font-bold text-foreground';
export const authInput =
  'h-12 rounded-xl border-[1.5px] bg-background pl-10 text-[15px] focus-visible:ring-offset-0 focus-visible:border-foreground';
export const authLink =
  'rounded-sm font-bold text-foreground underline decoration-primary decoration-2 underline-offset-4 transition-colors hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
export const authAlert = 'mb-4 flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm font-medium text-danger';
