import * as React from 'react';
import { Metadata } from 'next';
import { StoreHeader } from '@/components/layout/store-header';
import { StoreFooter } from '@/components/layout/store-footer';
import { CheckoutView } from '@/components/modules/checkout/CheckoutView';

export const metadata: Metadata = {
  title: 'Cannabis Order Checkout — Owtlet™',
  description:
    'Multi-dispensary fulfillment, pickup, and delivery routing across licensed New York retail partners.',
};

export default function CheckoutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <StoreHeader />

      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-content px-4 sm:px-7">
          <CheckoutView />
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}
