'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  Store,
  Tag,
  ShoppingBag,
  Tv,
  Link2,
  LogOut,
  User,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminUserDto } from '@/types/api.generated';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Inventory', href: '/admin/inventory', icon: Layers },
  { label: 'Dispensaries', href: '/admin/dispensaries', icon: Store },
  { label: 'Vendor Mappings', href: '/admin/mappings', icon: Link2 },
  { label: 'Brands', href: '/admin/brands', icon: Tag },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Live Shows', href: '/admin/live-shows', icon: Tv },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AdminUserDto | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) return;

    fetch('/api/admin/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.user) {
          setCurrentUser(data.data.user);
        }
      })
      .catch(() => {});
  }, [isLoginPage]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  const navLinks = (
    <nav aria-label="Admin" className="flex-1 space-y-1 p-3">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
            )}
          >
            <Icon className={cn('h-4 w-4', isActive ? 'text-primary-foreground' : 'text-primary')} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const logo = (
    <Link
      href="/admin"
      className="rounded font-heading text-[21px] leading-none tracking-[-0.01em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      Owtlet<sup className="ml-0.5 text-[10px] text-primary">™</sup>
      <span className="ml-2 align-middle font-mono text-[11px] font-bold tracking-[0.14em] text-strain-sativa">ADMIN</span>
    </Link>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      {/* Mobile header */}
      <header className="dark sticky top-0 z-40 flex items-center justify-between border-b border-border bg-owtlet-ink px-4 py-3 md:hidden">
        {logo}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-border text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          'dark z-30 w-full shrink-0 flex-col overflow-y-auto border-r border-border bg-owtlet-ink text-foreground md:sticky md:top-0 md:flex md:h-screen md:w-64',
          mobileMenuOpen ? 'flex' : 'hidden'
        )}
      >
        <div className="hidden border-b border-border px-5 py-6 md:block">
          {logo}
          <p className="mt-2.5 inline-flex items-center gap-2 font-mono text-[11px] font-bold tracking-[0.12em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent motion-safe:animate-live-ring" aria-hidden="true" />
            OPS &amp; CATALOG CONSOLE
          </p>
        </div>

        {navLinks}

        <div className="space-y-2 border-t border-border p-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span>View Storefront</span>
            <ExternalLink className="h-3.5 w-3.5 text-primary" />
          </a>

          <div className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-card px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                <User className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                {currentUser ? (
                  <>
                    <div className="truncate text-xs font-semibold text-foreground">{currentUser.email}</div>
                    <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-strain-sativa">
                      {currentUser.role}
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5" role="status" aria-label="Loading account">
                    <span className="block h-2.5 w-28 animate-pulse rounded bg-foreground/10" />
                    <span className="block h-2 w-12 animate-pulse rounded bg-foreground/10" />
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sign out"
              title="Sign out"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-danger/15 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="min-h-screen flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-7 md:py-10">{children}</div>
      </main>
    </div>
  );
}
