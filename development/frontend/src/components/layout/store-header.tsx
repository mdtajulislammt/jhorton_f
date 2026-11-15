'use client';

import * as React from 'react';
import Link from 'next/link';
import { ShoppingBag, Radio, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function StoreHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Age Badge */}
        <div className="flex items-center gap-3">
          <Link href="/shop" className="flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
            <span className="font-heading text-2xl tracking-tight text-foreground">
              Owtlet<span className="text-primary text-xl">™</span>
            </span>
          </Link>
          <Badge variant="outline" className="hidden sm:inline-flex border-owtlet-ink/20 text-xs font-semibold py-0.5">
            <ShieldCheck className="mr-1 h-3.5 w-3.5 text-primary" />
            21+ Verified
          </Badge>
        </div>

        {/* Category Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/shop" className="text-foreground hover:text-primary transition-colors">
            All Products
          </Link>
          <Link href="/shop/flower" className="text-muted-foreground hover:text-primary transition-colors">
            Flower
          </Link>
          <Link href="/shop/pre-rolls" className="text-muted-foreground hover:text-primary transition-colors">
            Pre-Rolls
          </Link>
          <Link href="/shop/vapes" className="text-muted-foreground hover:text-primary transition-colors">
            Vapes
          </Link>
          <Link href="/shop/edibles" className="text-muted-foreground hover:text-primary transition-colors">
            Edibles
          </Link>
          <Link href="/shop/concentrates" className="text-muted-foreground hover:text-primary transition-colors">
            Concentrates
          </Link>
        </nav>

        {/* Actions: Live Show & Cart */}
        <div className="flex items-center gap-2.5">
          <Link href="/live">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-accent font-bold hover:bg-accent/10">
              <Radio className="mr-1.5 h-4 w-4 animate-pulse" />
              Live Shows
            </Button>
          </Link>

          <Link href="/cart">
            <Button
              variant="default"
              size="sm"
              className="relative min-h-[44px] px-3 font-bold active:scale-[0.98]"
              aria-label="View Cart"
            >
              <ShoppingBag className="h-4 w-4 mr-1.5" />
              <span>Cart</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

