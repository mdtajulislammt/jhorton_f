import * as React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { StoreHeader } from '@/components/layout/store-header';
import { StoreFooter } from '@/components/layout/store-footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ShieldCheck, ShoppingBag, ArrowRight } from 'lucide-react';

interface OrderConfirmationPageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: 'Order Confirmed — Owtlet™',
  description: 'Your licensed cannabis order has been routed to partner dispensaries.',
};

export default function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <StoreHeader />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center space-y-6">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <Badge className="bg-primary/15 text-primary border-primary/30 text-xs font-semibold px-3 py-1">
            Order Submitted
          </Badge>

          <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
            Order Confirmed!
          </h1>

          <p className="text-sm text-muted-foreground max-w-md leading-relaxed font-mono">
            Order ID: <span className="text-foreground font-semibold">{params.id}</span>
          </p>

          <div className="p-4 rounded-xl border border-border bg-card text-left text-xs text-muted-foreground space-y-2 max-w-md w-full">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Licensed Dispensary Handoff</span>
            </div>
            <p>
              Your sub-orders have been routed to each licensed partner dispensary. Physical 21+
              photo ID verification and final payment will occur upon delivery arrival or in-store pickup.
            </p>
          </div>

          <div className="pt-2">
            <Link href="/shop">
              <Button className="bg-primary text-primary-foreground hover:bg-owtlet-volt font-semibold text-xs px-6 py-3 rounded-xl active:scale-[0.98]">
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

