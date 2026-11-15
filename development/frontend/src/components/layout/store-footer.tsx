import * as React from 'react';
import Link from 'next/link';

export function StoreFooter() {
  return (
    <footer className="border-t border-border bg-card text-card-foreground mt-20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <span className="font-heading text-2xl tracking-tight text-foreground">
              Owtlet<span className="text-primary text-xl">™</span>
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
              Live shopping and marketplace for legal adult-use cannabis in New York State.
              Connecting verified 21+ consumers with premier licensed local dispensaries in
              Manhattan, Brooklyn, Queens, Westchester, and Long Island.
            </p>
            <p className="text-[11px] font-semibold text-primary">
              Strict 21+ Adult-Use Compliance · Zero Online Cannabis Payments
            </p>
          </div>

          {/* Quick Categories */}
          <div className="space-y-2">
            <h4 className="font-heading text-sm text-foreground">Shop Categories</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li><Link href="/shop/flower" className="hover:text-primary">Craft Flower</Link></li>
              <li><Link href="/shop/pre-rolls" className="hover:text-primary">Pre-Rolls & Infused</Link></li>
              <li><Link href="/shop/vapes" className="hover:text-primary">All-in-One & 510 Vapes</Link></li>
              <li><Link href="/shop/edibles" className="hover:text-primary">Rosin Gummies & Chocolates</Link></li>
              <li><Link href="/shop/concentrates" className="hover:text-primary">Live Rosin & Concentrates</Link></li>
            </ul>
          </div>

          {/* Compliance & Legal */}
          <div className="space-y-2">
            <h4 className="font-heading text-sm text-foreground">Legal & Compliance</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Owtlet is a technology platform, not a licensed cannabis retailer. All cannabis orders
              are fulfilled and physically verified by NYS Office of Cannabis Management (OCM) licensed
              dispensaries.
            </p>
            <p className="text-[11px] text-muted-foreground">
              Keep out of reach of children. For use only by adults 21 years of age and older.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-border/60 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground gap-2">
          <span>© {new Date().getFullYear()} Owtlet™. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/age-gate" className="hover:text-primary">Age Verification</Link>
            <Link href="/api/health" className="hover:text-primary">System Status</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

