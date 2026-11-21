import * as React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { StoreHeader } from '@/components/layout/store-header';
import { StoreFooter } from '@/components/layout/store-footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HandoffButton } from '@/components/modules/checkout/HandoffButton';
import { serverFetch } from '@/lib/server-api';
import { OrderDetailDto } from '@/types/api.generated';
import {
  CheckCircle2,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  Package,
  ExternalLink,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface OrderConfirmationPageProps {
  params: {
    id: string;
  };
  searchParams?: {
    confirmed?: string;
  };
}

export const metadata: Metadata = {
  title: 'Order Status & Dispensary Tracking — Owtlet™',
  description: 'Track your licensed NY cannabis order status and dispensary confirmation.',
};

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: OrderConfirmationPageProps) {
  const isJustConfirmed = searchParams?.confirmed === 'true';

  let order: OrderDetailDto | null = null;
  try {
    order = await serverFetch<OrderDetailDto>(`/orders/${params.id}`);
  } catch {
    order = null;
  }

  const isAllConfirmed = order?.status === 'CONFIRMED';
  const isPartiallyConfirmed = order?.status === 'PARTIALLY_CONFIRMED';
  const isCancelled = order?.status === 'CANCELLED';

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <StoreHeader />

      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header Banner */}
          <div className="text-center flex flex-col items-center space-y-4">
            <div
              className={`h-14 w-14 rounded-full flex items-center justify-center shadow-sm ${
                isAllConfirmed
                  ? 'bg-primary/20 text-primary'
                  : isCancelled
                  ? 'bg-destructive/20 text-destructive'
                  : 'bg-primary/20 text-primary'
              }`}
            >
              {isCancelled ? (
                <AlertTriangle className="h-8 w-8" />
              ) : (
                <CheckCircle2 className="h-8 w-8" />
              )}
            </div>

            <div className="space-y-1">
              <Badge
                className={`text-xs font-semibold px-3 py-1 ${
                  isAllConfirmed
                    ? 'bg-primary/20 text-primary border-primary/30'
                    : isPartiallyConfirmed
                    ? 'bg-warning/20 text-foreground border-transparent'
                    : isCancelled
                    ? 'bg-destructive/15 text-destructive border-destructive/30'
                    : 'bg-primary/15 text-primary border-primary/30'
                }`}
              >
                {order ? `Status: ${order.status.replace('_', ' ')}` : 'Order Received'}
              </Badge>
              <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                {isAllConfirmed
                  ? 'Order Confirmed!'
                  : isPartiallyConfirmed
                  ? 'Partially Confirmed'
                  : isCancelled
                  ? 'Order Cancelled'
                  : order?.status === 'HANDED_OFF'
                  ? 'Handoff in Progress'
                  : 'Order Placed!'}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-mono">
                Order Number:{' '}
                <span className="text-foreground font-semibold">
                  {order?.orderNumber || params.id}
                </span>
              </p>
            </div>
          </div>

          {/* Just-Confirmed Alert Banner */}
          {isJustConfirmed && (
            <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Handoff Successfully Completed!
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your dispensary received your reservation. The store team is preparing your order.
                </p>
              </div>
            </div>
          )}

          {/* Sub-Orders List */}
          {order && order.subOrders && order.subOrders.length > 0 ? (
            <div className="space-y-4">
              <h2 className="font-heading text-lg font-bold text-foreground">
                Dispensary Fulfillment &amp; Handoff
              </h2>
              <div className="space-y-4">
                {order.subOrders.map((subOrder) => {
                  const isSubConfirmed = subOrder.status === 'CONFIRMED';
                  const isSubRejected = subOrder.status === 'REJECTED';
                  const isPickup = subOrder.fulfillmentType === 'PICKUP';

                  return (
                    <div
                      key={subOrder.id}
                      className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs"
                    >
                      {/* Sub-order header */}
                      <div className="p-4 sm:p-5 flex items-start justify-between gap-4 border-b border-border/60">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {isPickup ? (
                              <Store className="h-4 w-4 text-primary" />
                            ) : (
                              <Truck className="h-4 w-4 text-accent" />
                            )}
                            <h3 className="font-heading font-bold text-base text-foreground">
                              {subOrder.dispensaryName}
                            </h3>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {subOrder.dispensaryAddress}
                          </p>
                          <span className="inline-block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            {isPickup ? 'In-Store Pickup' : 'Direct Delivery'}
                          </span>
                        </div>

                        <div>
                          <Badge
                            className={`text-xs font-semibold ${
                              isSubConfirmed
                                ? 'bg-primary/20 text-primary border-primary/30'
                                : isSubRejected
                                ? 'bg-destructive/15 text-destructive border-destructive/30'
                                : 'bg-secondary text-secondary-foreground'
                            }`}
                          >
                            {subOrder.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>

                      {/* Line items in this sub-order */}
                      <div className="p-4 sm:p-5 divide-y divide-border/40">
                        {subOrder.lines.map((line) => (
                          <div
                            key={line.productId}
                            className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="font-medium text-foreground">
                                {line.productName}
                              </span>
                              <span className="text-muted-foreground">
                                &times; {line.quantity}
                              </span>
                            </div>
                            <span className="font-mono text-muted-foreground">
                              ${line.lineTotal}
                            </span>
                          </div>
                        ))}

                        <div className="pt-3 flex justify-between font-bold text-xs text-foreground">
                          <span>Sub-Order Total</span>
                          <span className="font-mono">${subOrder.total}</span>
                        </div>
                      </div>

                      {/* Confirmation details (when CONFIRMED) */}
                      {isSubConfirmed && (
                        <div className="mx-4 sm:mx-5 mb-4 p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-2 text-xs">
                          <p className="font-semibold text-foreground flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            Confirmed by {subOrder.dispensaryName}
                          </p>
                          <p className="text-muted-foreground text-[11px]">
                            {isPickup
                              ? 'Your items are reserved and will be held for pickup during regular store hours. Bring valid 21+ government photo ID.'
                              : 'Your delivery has been scheduled with the dispensary. You will receive SMS updates from the store driver.'}
                          </p>
                          {subOrder.confirmationUrl && (
                            <div className="pt-1">
                              <a
                                href={subOrder.confirmationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-[11px] font-semibold text-foreground underline decoration-primary decoration-2 underline-offset-4 hover:decoration-foreground"
                              >
                                View Order on {subOrder.dispensaryName} Website
                                <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Rejection notice (when REJECTED) */}
                      {isSubRejected && (
                        <div className="mx-4 sm:mx-5 mb-4 p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 space-y-1 text-xs text-destructive">
                          <p className="font-semibold flex items-center gap-1.5">
                            <AlertTriangle className="h-4 w-4" />
                            Dispensary Could Not Fulfill
                          </p>
                          <p className="text-muted-foreground text-[11px]">
                            {subOrder.dispensaryName} was unable to accept this sub-order. Our support team has been notified and will assist in re-routing your products.
                          </p>
                        </div>
                      )}

                      {/* Handoff Button Section (when not confirmed and not rejected) */}
                      {!isSubConfirmed && !isSubRejected && (
                        <div className="p-4 sm:p-5 pt-0">
                          <HandoffButton
                            subOrderId={subOrder.id}
                            orderId={order.id}
                            dispensaryName={subOrder.dispensaryName}
                            handoffChannel={subOrder.handoffChannel}
                            initialHandoffUrl={subOrder.handoffUrl}
                            status={subOrder.status}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-border bg-card text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Your order details have been recorded. If you do not see the dispensary handoff
                buttons, please refresh this page with your active session.
              </p>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/shop" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto min-h-[44px] border-border text-foreground hover:bg-secondary rounded-xl font-semibold text-xs px-6 active:scale-[0.98]"
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                Return to Shop
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}
