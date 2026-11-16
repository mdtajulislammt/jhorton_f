import * as React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { StoreHeader } from '@/components/layout/store-header';
import { StoreFooter } from '@/components/layout/store-footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HandoffButton } from '@/components/modules/checkout/HandoffButton';
import { CART_COOKIE_NAME } from '@/server/cart/session';
import { getOrderById, OrderDetailDto } from '@/server/orders';
import { verifyShopperToken } from '@/server/shopper-account/crypto';
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
  const cookieStore = cookies();
  const cartToken = cookieStore.get(CART_COOKIE_NAME)?.value || null;
  const rawShopperCookie = cookieStore.get('owt_shopper')?.value || null;
  let shopperId: string | null = null;
  if (rawShopperCookie) {
    const verification = await verifyShopperToken(rawShopperCookie);
    if (verification.valid && verification.shopperId) {
      shopperId = verification.shopperId;
    }
  }
  const isJustConfirmed = searchParams?.confirmed === 'true';

  let order: OrderDetailDto | null = null;
  try {
    order = await getOrderById(params.id, {
      cartSessionToken: cartToken,
      shopperId,
      isAdmin: false,
    });
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
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
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
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" />
              <div className="space-y-0.5 text-xs sm:text-sm">
                <p className="font-heading font-semibold text-foreground">
                  Dispensary Confirmation Recorded
                </p>
                <p className="text-muted-foreground">
                  The partner dispensary confirmation webhook has been verified. Your order status has been updated in real time.
                </p>
              </div>
            </div>
          )}

          {/* Compliance & Zero Payment Banner */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 flex items-start gap-3.5">
            <ShieldCheck className="h-5 w-5 shrink-0 text-primary mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              <p className="font-heading font-semibold text-foreground text-xs uppercase tracking-wide">
                Compliant Dispensary Fulfillment
              </p>
              <p>
                Owtlet routes your cannabis items to licensed NY dispensary partners. Under NY state
                regulations, <strong>final payment and physical 21+ government photo ID verification</strong>{' '}
                occur directly with each partner dispensary at fulfillment.
              </p>
            </div>
          </div>

          {/* Sub-Orders List with Confirmation Details */}
          {order && order.subOrders.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Dispensary Sub-Orders ({order.subOrders.length})
                </h2>
                <span className="text-xs text-muted-foreground font-medium">
                  Total: ${order.subtotal}
                </span>
              </div>

              <div className="space-y-5">
                {order.subOrders.map((subOrder) => {
                  const isSubConfirmed = subOrder.status === 'CONFIRMED';
                  const isSubRejected = subOrder.status === 'REJECTED';
                  const isSubHandedOff = subOrder.status === 'HANDED_OFF';

                  return (
                    <div
                      key={subOrder.id}
                      className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
                    >
                      {/* Sub-Order Header */}
                      <div className="p-4 sm:p-5 border-b border-border/60 bg-secondary/20 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Store className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-heading text-sm font-semibold text-foreground">
                              {subOrder.dispensaryName}
                            </h3>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                {subOrder.fulfillmentType === 'DELIVERY' ? (
                                  <>
                                    <Truck className="h-3 w-3" /> NY Delivery
                                  </>
                                ) : (
                                  <>
                                    <Store className="h-3 w-3" /> Dispensary Pickup
                                  </>
                                )}
                              </span>
                              <span>•</span>
                              <span>Subtotal: ${subOrder.subtotal}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {isSubConfirmed ? (
                          <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-semibold px-2.5 py-0.5 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Confirmed
                          </Badge>
                        ) : isSubRejected ? (
                          <Badge
                            variant="destructive"
                            className="text-xs font-semibold px-2.5 py-0.5 flex items-center gap-1"
                          >
                            <AlertTriangle className="h-3 w-3" /> Declined
                          </Badge>
                        ) : isSubHandedOff ? (
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary border border-primary/20 text-xs font-medium px-2.5 py-0.5 flex items-center gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Transferred to Store
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs text-muted-foreground border-border px-2.5 py-0.5 flex items-center gap-1"
                          >
                            <Clock className="h-3 w-3" /> Pending Review
                          </Badge>
                        )}
                      </div>

                      {/* Items List */}
                      <div className="p-4 sm:p-5 space-y-2.5">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Allocated Products
                        </p>
                        <ul className="divide-y divide-border/40 text-xs">
                          {subOrder.items.map((item) => (
                            <li
                              key={item.id}
                              className="py-2 flex items-center justify-between gap-2"
                            >
                              <span className="text-foreground font-medium">
                                {item.quantity}× {item.name}
                              </span>
                              <span className="font-mono text-muted-foreground">
                                ${item.lineTotal}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Confirmation Details Card (when CONFIRMED) */}
                      {isSubConfirmed && (
                        <div className="mx-4 sm:mx-5 mb-4 p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                              Store Confirmation
                            </span>
                            {subOrder.confirmationRef && (
                              <span className="font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                                Ref: {subOrder.confirmationRef}
                              </span>
                            )}
                          </div>
                          {subOrder.confirmedAt && (
                            <p className="text-muted-foreground text-[11px]">
                              Confirmed by {subOrder.dispensaryName} at{' '}
                              <span className="text-foreground font-medium">
                                {new Date(subOrder.confirmedAt).toLocaleString('en-US', {
                                  timeZone: 'America/New_York',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                })}{' '}
                                EST
                              </span>
                            </p>
                          )}
                          {subOrder.confirmationUrl && (
                            <div className="pt-1">
                              <a
                                href={subOrder.confirmationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-[11px] font-semibold text-primary hover:underline"
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

          {/* Guest Shopper: Save Info for Next Time Prompt */}
          {order && !order.shopperId && (
            <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-heading font-semibold text-foreground text-sm flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Save your info for next time
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Create an optional shopper profile to remember your default store and addresses for faster future checkouts.
                </p>
              </div>
              <Link
                href={`/account/register?email=${encodeURIComponent(order.contact.email)}&firstName=${encodeURIComponent(order.contact.firstName)}&lastName=${encodeURIComponent(order.contact.lastName)}&phone=${encodeURIComponent(order.contact.phone)}&zip=${encodeURIComponent(order.zip)}`}
                className="shrink-0"
              >
                <Button className="min-h-[40px] text-xs font-bold px-4 active:scale-[0.98]">
                  Create Profile
                </Button>
              </Link>
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
