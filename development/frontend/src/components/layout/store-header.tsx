'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MapPin, Search, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useCheckoutStore, FulfillmentType } from '@/stores/checkout.store';
import { CartDrawer } from '@/components/modules/cart/cart-drawer';
import { cn } from '@/lib/utils';

const NAV_LINKS: { href: string; label: string; live?: boolean }[] = [
  { href: '/live', label: 'Live', live: true },
  { href: '/shop', label: 'Shop all' },
  { href: '/shop/flower', label: 'Flower' },
  { href: '/shop/pre-rolls', label: 'Pre-Rolls' },
  { href: '/shop/vapes', label: 'Vapes' },
  { href: '/shop/edibles', label: 'Edibles' },
  { href: '/shop/concentrates', label: 'Concentrates' },
  { href: '/brands', label: 'Brands' },
  { href: '/videos', label: 'Videos' },
];

const FULFILLMENT_OPTIONS: { value: FulfillmentType; label: string }[] = [
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'PICKUP', label: 'Pickup' },
];

function isActive(pathname: string, href: string) {
  if (href === '/shop') return pathname === '/shop';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StoreHeader() {
  const { itemCount, openCart } = useCart();
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const fulfillmentType = useCheckoutStore((s) => s.fulfillmentType);
  const setFulfillmentType = useCheckoutStore((s) => s.setFulfillmentType);
  const zip = useCheckoutStore((s) => s.zip);
  const zipArea = useCheckoutStore((s) => s.zipArea);

  // Persisted store values only exist in the browser; render them after mount to avoid hydration drift.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const [query, setQuery] = React.useState('');
  const searchRef = React.useRef<HTMLInputElement>(null);

  // "/" focuses the search box (shown as a key hint), unless the shopper is already typing somewhere.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
        <div className="mx-auto max-w-content px-4 sm:px-7">
          {/* Row 1: logo, search, location, account, cart */}
          <div className="flex flex-wrap items-center gap-2.5 py-[14px] sm:gap-[18px]">
            <Link
              href="/"
              className="mr-auto rounded font-heading text-[23px] tracking-[-0.01em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:mr-0"
            >
              Owtlet<sup className="ml-0.5 text-[11px] text-success">™</sup>
            </Link>

            <form
              role="search"
              onSubmit={onSearch}
              className="order-last flex min-w-0 basis-full items-center gap-2.5 rounded-[14px] border border-transparent bg-surface-muted px-[14px] py-[11px] text-sm transition-colors focus-within:border-foreground/30 focus-within:bg-card hover:border-border sm:order-none sm:flex-1 sm:basis-auto"
            >
              <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
              <label htmlFor="store-search" className="sr-only">
                Search products, brands and strains
              </label>
              <input
                id="store-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search strains, brands, products and shows"
                ref={searchRef}
                className="min-w-0 flex-1 bg-transparent text-foreground placeholder:text-muted focus:outline-none"
              />
              <kbd
                aria-hidden="true"
                className="ml-auto hidden rounded-md border border-border bg-card px-1.5 font-mono text-[11px] text-muted sm:inline-block"
              >
                /
              </kbd>
            </form>

            <Link
              href="/#check-zip"
              className="hidden items-center gap-2 rounded-[14px] border border-border bg-card px-3 py-2 text-left text-[13px] leading-tight transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex"
            >
              <MapPin className="h-4 w-4 text-foreground" aria-hidden="true" />
              <span>
                <span className="block text-[11px] text-muted">
                  {fulfillmentType === 'DELIVERY' ? 'Delivering to' : 'Pickup near'}
                </span>
                <span className="block font-bold text-foreground">
                  {mounted && zip ? (zipArea ? `${zip} · ${zipArea}` : zip) : 'Set ZIP'}
                </span>
              </span>
            </Link>

            <Link
              href="/account"
              aria-label="Profile"
              className="grid h-[42px] w-[42px] place-items-center rounded-xl border border-border bg-card transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <User className="h-5 w-5 text-foreground" />
            </Link>

            <button
              type="button"
              onClick={openCart}
              aria-label={`View Cart, ${itemCount} items`}
              className="relative grid h-[42px] w-[42px] place-items-center rounded-xl border border-border bg-card transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ShoppingBag className="h-5 w-5 text-foreground" />
              {itemCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-foreground">
                  {itemCount}
                </span>
              )}
            </button>
          </div>

          {/* Row 2: category nav + fulfillment toggle */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 pt-1.5">
            <nav
              aria-label="Main"
              className="-mx-1 flex min-w-0 basis-full gap-1 overflow-x-auto [scrollbar-width:none] sm:flex-1 sm:basis-auto [&::-webkit-scrollbar]:hidden"
            >
              {NAV_LINKS.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group relative flex items-center gap-[7px] whitespace-nowrap rounded-sm px-3 pb-3.5 pt-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {link.live ? (
                      <span className="h-2 w-2 rounded-full bg-accent motion-safe:animate-live-ring" aria-hidden="true" />
                    ) : null}
                    {link.label}
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-x-3 bottom-0 h-[3px] origin-left rounded-t bg-foreground transition-transform duration-300',
                        active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      )}
                    />
                  </Link>
                );
              })}
            </nav>

            <div
              role="group"
              aria-label="Fulfillment"
              className="mb-2 inline-flex shrink-0 rounded-full bg-surface-muted p-[3px]"
            >
              {FULFILLMENT_OPTIONS.map((opt) => {
                const pressed = mounted && fulfillmentType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={pressed}
                    onClick={() => setFulfillmentType(opt.value)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      pressed ? 'bg-ink text-owtlet-mist' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <CartDrawer />
    </>
  );
}
