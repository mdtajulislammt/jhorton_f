'use client';

import * as React from 'react';
import Link from 'next/link';
import { X, ShoppingBag, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useCart } from '@/hooks/useCart';
import { CartTimer } from './cart-timer';
import { CartLine } from './cart-line';
import { CartSkeleton } from './cart-skeleton';

export function CartDrawer() {
  const {
    cart,
    isLoading,
    isExpired,
    itemCount,
    estimatedSubtotal,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    clearCart,
    isClearing,
  } = useCart();

  // Escape key handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeCart]);

  // Lock body scroll when drawer is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping Stash">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-card border-l border-border shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg text-foreground">Your Stash</h2>
            <Badge variant="secondary" className="font-semibold text-xs px-2 py-0.5">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground hover:text-foreground active:scale-[0.98]"
            onClick={closeCart}
            aria-label="Close cart drawer"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Hold Timer Banner */}
        {cart?.items && cart.items.length > 0 && !isExpired && (
          <div className="px-5 pt-3">
            <CartTimer hold={cart?.hold} />
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {isLoading ? (
            <CartSkeleton />
          ) : isExpired ? (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                <RefreshCw className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-base text-foreground mb-1">
                Cart Hold Expired
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mb-6">
                Your 30-minute hold window lapsed. Cannabis items have been returned to partner dispensary inventory.
              </p>
              <Link href="/shop" onClick={closeCart}>
                <Button variant="default" className="font-bold min-h-[44px] px-6">
                  Browse Catalog
                </Button>
              </Link>
            </div>
          ) : itemCount === 0 ? (
            <div className="py-8">
              <EmptyState
                title="Your stash is empty"
                description="Explore premier NY licensed flower, vapes, pre-rolls, and live drop specials."
                action={{
                  label: 'Shop Cannabis Catalog',
                  href: '/shop',
                  onClick: closeCart,
                }}
              />
            </div>
          ) : (
            <div className="divide-y divide-border/40">
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
          )}
        </div>

        {/* Footer */}
        {itemCount > 0 && !isExpired && (
          <div className="border-t border-border bg-card/95 p-5 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-base">
                <span className="font-medium text-muted-foreground">Estimated Subtotal</span>
                <span className="font-heading text-xl font-bold text-foreground">
                  ${estimatedSubtotal}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Partner store fulfillment & 21+ ID verified upon delivery/pickup</span>
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Link href="/cart" onClick={closeCart} className="w-full">
                <Button
                  className="w-full min-h-[48px] font-bold text-base shadow-md active:scale-[0.98]"
                  size="lg"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <div className="flex items-center justify-between pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-destructive h-8 px-2 active:scale-[0.98]"
                  onClick={() => clearCart()}
                  disabled={isClearing}
                >
                  Clear Stash
                </Button>
                <Link
                  href="/shop"
                  onClick={closeCart}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
