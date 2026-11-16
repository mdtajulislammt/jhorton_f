import * as React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { StoreHeader } from '@/components/layout/store-header';
import { StoreFooter } from '@/components/layout/store-footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, ArrowLeft, ShieldCheck, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cannabis Order Checkout — Owtlet™',
  description: 'Multi-dispensary fulfillment, pickup, and delivery routing for New York legal cannabis.',
};

export default function CheckoutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <StoreHeader />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <Badge variant="outline" className="border-accent text-accent font-semibold text-xs mb-4">
            Dispensary Routing & Handoff
          </Badge>

          <h1 className="font-heading text-3xl sm:text-4xl text-foreground mb-4">
            Cannabis Checkout
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mb-8 leading-relaxed">
            Your cart reservation is confirmed. Multi-dispensary ZIP allocation and Leafly/retailer pickup and delivery scheduling will be finalized here.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mb-8 text-left">
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 font-semibold text-xs text-foreground mb-1">
                <MapPin className="h-4 w-4 text-primary" />
                Licensed NY Retailers
              </div>
              <p className="text-xs text-muted-foreground">
                Orders split automatically across Manhattan, BK, and Queens dispensaries.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 font-semibold text-xs text-foreground mb-1">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Zero-ID Compliance
              </div>
              <p className="text-xs text-muted-foreground">
                Payment and physical ID inspection handled directly by dispensary partner.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/cart">
              <Button variant="outline" className="border-border">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Cart
              </Button>
            </Link>
            <Link href="/shop">
              <Button className="bg-primary text-primary-foreground hover:bg-owtlet-volt font-semibold">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}

