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
import {
  CheckCircle2,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  Package,
} from 'lucide-react';

interface OrderConfirmationPageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: 'Order Status & Dispensary Handoff — Owtlet™',
  description: 'Your licensed cannabis order has been routed to partner dispensaries.',
};

export default async function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const cookieStore = cookies();
  const cartToken = cookieStore.get(CART_COOKIE_NAME)?.value || null;
  const shopperCookie = cookieStore.get('owt_shopper')?.value || null;

  let order: OrderDetailDto | null = null;
  try {
    order = await getOrderById(params.id, {
      cartSessionToken: cartToken,
      shopperId: shopperCookie,
      isAdmin: false,
    });
  } catch {
    order = null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <StoreHeader />

      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header Banner */}
          <div className="text-center flex flex-col items-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-sm">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <Badge className="bg-primary/15 text-primary border-primary/30 text-xs font-semibold px-3 py-1">
                {order ? `Status: ${order.status}` : 'Order Received'}
              </Badge>
              <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                {order?.status === 'HANDED_OFF'
                  ? 'Handoff in Progress'
                  : order?.status === 'CONFIRMED'
                  ? 'Order Confirmed!'
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

          {/* Compliance & Zero Payment Banner */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 flex items-start gap-3.5">
            <ShieldCheck className="h-5 w-5 shrink-0 text-primary mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              <p className="font-heading font-semibold text-foreground text-xs uppercase tracking-wide">
                Compliant Dispensary Handoff
              </p>
              <p>
                Owtlet routes your cannabis items to licensed NY dispensary partners. Under NY state
                regulations, <strong>final payment and physical 21+ government photo ID verification</strong>{' '}
                occur directly with each partner dispensary at fulfillment.
              </p>
            </div>
          </div>

          {/* Sub-Orders List with Handoff Buttons */}
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
                {order.subOrders.map((subOrder) => (
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

                      <Badge
                        variant="outline"
                        className="text-xs capitalize font-medium px-2.5 py-0.5 border-border"
                      >
                        {subOrder.status.toLowerCase().replace('_', ' ')}
                      </Badge>
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

                    {/* Handoff Button Section */}
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
                  </div>
                ))}
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
