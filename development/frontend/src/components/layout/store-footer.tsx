import * as React from 'react';
import Link from 'next/link';

const FOOTER_COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Shop',
    links: [
      { href: '/shop', label: 'All products' },
      { href: '/shop/flower', label: 'Flower' },
      { href: '/shop/pre-rolls', label: 'Pre-Rolls' },
      { href: '/shop/vapes', label: 'Vapes' },
      { href: '/shop/edibles', label: 'Edibles' },
    ],
  },
  {
    title: 'Watch',
    links: [
      { href: '/live', label: 'Live Shows' },
      { href: '/live#replays', label: 'Replays' },
      { href: '/videos', label: 'Shoppable Videos' },
      { href: '/brands', label: 'Brand Storefronts' },
    ],
  },
  {
    title: 'Your account',
    links: [
      { href: '/account', label: 'Profile' },
      { href: '/account#orders', label: 'Orders' },
      { href: '/cart', label: 'Cart' },
    ],
  },
  {
    title: 'Compliance',
    links: [
      { href: '/age-gate', label: 'Age verification' },
      { href: '/#check-zip', label: 'Delivery coverage' },
    ],
  },
];

/** `flush` removes the top margin (home page: the coverage band sits directly on the footer, as in design v3). */
export function StoreFooter({ flush = false }: { flush?: boolean } = {}) {
  return (
    <footer className={`dark bg-owtlet-night text-[14px] text-muted-foreground ${flush ? '' : 'mt-20'}`}>
      <div className="mx-auto flex max-w-content flex-col gap-[26px] px-4 pb-7 pt-11 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="rounded font-heading text-[23px] tracking-[-0.01em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Owtlet<sup className="ml-0.5 text-[11px] text-primary">™</sup>
          </Link>
          <span className="text-sm">Live Shopping for Cannabis.</span>
          <span className="rounded-full bg-strain-sativa px-3 py-1 text-xs font-bold text-owtlet-ink">21+ only</span>
        </div>

        <div className="grid grid-cols-2 gap-5 border-y border-border py-6 md:grid-cols-4">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-2.5 text-[13px] font-bold text-primary">{col.title}</h4>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-muted">
          <p className="max-w-[110ch]">
            Owtlet is a live shopping platform for adults 21 and older. Every cannabis product is sold, ID-checked and
            fulfilled by a New York State licensed dispensary. Owtlet never takes payment for cannabis. We currently serve
            Manhattan, Queens, Brooklyn, Westchester and Long Island.
          </p>
          {/* NY OCM advertising warning — kept for compliance (not in the mockup) */}
          <p>Keep out of reach of children. For use only by adults 21 years of age and older.</p>
        </div>
      </div>
    </footer>
  );
}
