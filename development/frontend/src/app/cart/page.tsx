'use client';

import * as React from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, ShieldCheck, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { StoreHeader } from '@/components/layout/store-header';
import { StoreFooter } from '@/components/layout/store-footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useCart } from '@/hooks/useCart';
import { CartTimer } from '@/components/modules/cart/cart-timer';
import { CartLine } from '@/components/modules/cart/cart-line';
import { CartSkeleton } from '@/components/modules/cart/cart-skeleton';
import { CartDrawer } from '@/components/modules/cart/cart-drawer';

export default function CartPage() {
  const {
    cart,
    isLoading,
    isExpired,
    itemCount,
    estimatedSubtotal,
    updateQuantity,
    removeItem,
    clearCart,
    isClearing,
  } = useCart();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <StoreHeader />
      <CartDrawer />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/shop"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Catalog
          </Link>

          {itemCount > 0 && !isExpired && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearCart()}
              disabled={isClearing}
              className="text-xs text-muted-foreground hover:text-destructive h-8 active:scale-[0.98]"
            >
              Clear Stash
            </Button>
          )}
        </div>

        {/* Page Title */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl text-foreground tracking-tight">
              Review Your Stash
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Legal adult-use cannabis held for partner dispensary fulfillment in New York.
            </p>
          </div>

          <Badge variant="outline" className="self-start sm:self-auto border-owtlet-ink/20 px-3 py-1 text-xs font-semibold">
            <ShieldCheck className="mr-1.5 h-4 w-4 text-primary" />
            21+ Verified Attestation
          </Badge>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="max-w-3xl">
            <CartSkeleton />
          </div>
        ) : isExpired ? (
          <div className="max-w-xl mx-auto py-16 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
              <RefreshCw className="h-8 w-8" />
            </div>
            <h2 className="font-heading text-2xl text-foreground mb-2">
              Your Cart Hold Has Expired
            </h2>
            <p className="text-muted-foreground mb-8 text-sm sm:text-base leading-relaxed">
              Items reserved from live shopping drops or the catalog are held for 30 minutes. Unclaimed inventory has been returned to licensed partner menus.
            </p>
            <Link href="/shop">
              <Button size="lg" className="min-h-[48px] px-8 font-bold active:scale-[0.98]">
                Start a Fresh Stash
              </Button>
            </Link>
          </div>
        ) : itemCount === 0 ? (
          <div className="py-12">
            <EmptyState
              title="Your stash is empty"
              description="Explore premium NY licensed cannabis strains, edibles, pre-rolls, and live drop specials."
              action={{
                label: 'Shop Cannabis Catalog',
                href: '/shop',
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Items Column (7 cols) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              {/* Hold Timer Banner */}
              <CartTimer hold={cart?.hold} className="mb-2" />

              <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm divide-y divide-border/60">
                {cart?.items.map((item) => (
                  <CartLine
                    key={item.id}
                    item={item}
                    onUpdateQuantity={(qty) =>
                      updateQuantity({ productId: item.productId, quantity: qty })
                    }
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

            {/* Order Summary & Fulfillment Column (5 cols) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-4">
              <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-5">
                <h2 className="font-heading text-lg text-foreground pb-2 border-b border-border/60">
                  Estimated Summary
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Items ({itemCount})</span>
                    <span className="font-semibold text-foreground">${estimatedSubtotal}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Estimated Dispensary Fulfillment</span>
                    <span className="text-xs font-medium text-owtlet-sage">Calculated at Checkout</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>State & Local Excise Tax</span>
                    <span className="text-xs font-medium text-owtlet-sage">Calculated at Checkout</span>
                  </div>

                  <div className="pt-3 border-t border-border flex justify-between items-baseline">
                    <span className="font-heading text-base font-bold text-foreground">Subtotal</span>
                    <span className="font-heading text-2xl font-bold text-foreground">
                      ${estimatedSubtotal}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/60 p-3.5 space-y-2 text-xs text-muted-foreground border border-border/40">
                  <div className="flex gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p>
                      <strong>Zero ID / Payment on Owtlet:</strong> Delivery & pickup fulfillment is handed off directly to our licensed NY partner dispensaries.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <p>
                      Physical 21+ government-issued ID must be presented and verified upon pickup or home delivery.
                    </p>
                  </div>
                </div>

                <Link href="/checkout" className="block w-full">
                  <Button
                    size="lg"
                    className="w-full min-h-[50px] font-bold text-base shadow-lg active:scale-[0.98]"
                  >
                    <span>Choose Dispensary & Checkout</span>
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <StoreFooter />
    </div>
  );
}
