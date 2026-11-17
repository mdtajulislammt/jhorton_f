'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, ArrowRight, RefreshCw, ShieldCheck, ShoppingBag } from 'lucide-react';
import { StoreHeader } from '@/components/layout/store-header';
import { StoreFooter } from '@/components/layout/store-footer';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useCart } from '@/hooks/useCart';
import { CartTimer } from '@/components/modules/cart/cart-timer';
import { CartLine } from '@/components/modules/cart/cart-line';
import { CartSkeleton } from '@/components/modules/cart/cart-skeleton';

export default function CartPage() {
  const {
    cart,
    isLoading,
    isError,
    refetch,
    isExpired,
    itemCount,
    estimatedSubtotal,
    updateQuantity,
    removeItem,
    clearCart,
    isClearing,
  } = useCart();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* StoreHeader already mounts the CartDrawer */}
      <StoreHeader />

      <main className="mx-auto w-full max-w-content flex-1 px-4 py-8 sm:px-7 sm:py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/shop"
            className="inline-flex min-h-[36px] items-center rounded-sm text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Back to Catalog
          </Link>

          {itemCount > 0 && !isExpired ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearCart()}
              disabled={isClearing}
              className="h-9 text-xs text-muted-foreground hover:text-danger"
            >
              Clear Stash
            </Button>
          ) : null}
        </div>

        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl tracking-tight text-foreground sm:text-4xl">Review Your Stash</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Legal adult-use cannabis held for partner dispensary fulfillment in New York.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-foreground sm:self-auto">
            <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
            21+ Verified Attestation
          </span>
        </div>

        {isLoading ? (
          <div className="max-w-3xl rounded-3xl border border-border bg-card p-5 sm:p-6">
            <CartSkeleton />
          </div>
        ) : isExpired ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card px-6 py-14 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-danger/10 text-danger">
              <RefreshCw className="h-8 w-8" aria-hidden="true" />
            </div>
            <h2 className="mb-2 font-heading text-2xl text-foreground">Your Cart Hold Has Expired</h2>
            <p className="mb-8 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Items reserved from live shopping drops or the catalog are held for 30 minutes. Unclaimed inventory has been
              returned to licensed partner menus.
            </p>
            <Link href="/shop">
              <Button size="lg" variant="ink" className="min-h-[48px] px-8 font-bold">
                Start a Fresh Stash
              </Button>
            </Link>
          </div>
        ) : isError && !cart ? (
          <EmptyState
            icon={AlertCircle}
            title="We couldn't load your stash"
            description="Check your connection and try again. Items you added are still held for you."
            action={{ label: 'Try again', onClick: () => refetch() }}
          />
        ) : itemCount === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Your stash is empty"
            description="Explore premium NY licensed cannabis strains, edibles, pre-rolls, and live drop specials."
            action={{ label: 'Shop Cannabis Catalog', href: '/shop' }}
          />
        ) : (
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7 xl:col-span-8">
              <CartTimer hold={cart?.hold} />

              <div className="divide-y divide-border rounded-3xl border border-border bg-card p-4 sm:p-6">
                {cart?.items.map((item) => (
                  <CartLine
                    key={item.id}
                    item={item}
                    onUpdateQuantity={(qty) => updateQuantity({ productId: item.productId, quantity: qty })}
                    onRemove={() =>
                      removeItem({
                        productId: item.productId,
                        channelBrandSlug: item.channelBrand?.slug,
                      })
                    }
                  />
                ))}
              </div>
            </div>

            <aside className="lg:sticky lg:top-36 lg:col-span-5 xl:col-span-4">
              <div className="space-y-5 rounded-3xl border border-border bg-card p-5 sm:p-6">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Estimated Summary</h2>

                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Items ({itemCount})</dt>
                    <dd className="font-mono font-semibold tabular-nums text-foreground">${estimatedSubtotal}</dd>
                  </div>
                  <div className="flex justify-between gap-3 text-muted-foreground">
                    <dt>Dispensary fulfillment</dt>
                    <dd className="text-xs font-semibold text-muted">Calculated at Checkout</dd>
                  </div>
                  <div className="flex justify-between gap-3 text-muted-foreground">
                    <dt>State &amp; local excise tax</dt>
                    <dd className="text-xs font-semibold text-muted">Calculated at Checkout</dd>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-border pt-4">
                    <dt className="text-base font-bold text-foreground">Subtotal</dt>
                    <dd className="font-mono text-3xl font-bold tabular-nums text-foreground">${estimatedSubtotal}</dd>
                  </div>
                </dl>

                <Link href="/checkout" className="block w-full">
                  <Button size="lg" className="min-h-[52px] w-full gap-2 text-base font-bold">
                    Choose Dispensary &amp; Checkout
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </Link>

                <div className="space-y-2.5 rounded-2xl bg-surface-muted p-4 text-xs leading-relaxed text-muted-foreground">
                  <p className="flex gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                    <span>
                      <strong className="text-foreground">Zero ID / Payment on Owtlet:</strong> Delivery &amp; pickup
                      fulfillment is handed off directly to our licensed NY partner dispensaries.
                    </span>
                  </p>
                  <p className="flex gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    <span>Physical 21+ government-issued ID must be presented and verified upon pickup or home delivery.</span>
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <StoreFooter />
    </div>
  );
}
