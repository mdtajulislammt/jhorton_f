'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useShopperOrders } from '@/hooks/useShopperAccount';
import { Package, ExternalLink, Clock, Store, ChevronRight } from 'lucide-react';

export function OrderHistory() {
  const { data: orders = [], isLoading } = useShopperOrders();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'success';
      case 'HANDED_OFF':
        return 'default';
      case 'SUBMITTED':
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="border border-border/80 bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-heading flex items-center gap-2 text-foreground">
          <Package className="h-5 w-5 text-primary" />
          Cannabis Order History
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Review your past orders and licensed dispensary routing handoffs.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-28 bg-muted animate-pulse rounded-xl" />
            <div className="h-28 bg-muted animate-pulse rounded-xl" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border/80 rounded-xl p-6">
            <Package className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-base font-semibold text-foreground">No orders yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-5 max-w-sm mx-auto">
              Explore live drop shows or our curated New York cannabis catalog to place your first order.
            </p>
            <Link href="/shop">
              <Button className="min-h-[44px] px-6 font-bold text-xs active:scale-[0.98]">
                Explore Catalog
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={order.id}
                  className="p-5 rounded-xl border border-border/80 bg-card hover:border-border transition-all"
                >
                  {/* Order Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-base text-foreground tracking-tight">
                        {order.orderNumber}
                      </span>
                      <Badge variant={getStatusBadgeVariant(order.status) as any} className="text-xs">
                        {order.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground uppercase font-semibold">
                        • {order.fulfillmentType}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {orderDate}
                      </span>
                      <span className="text-base font-bold text-foreground">
                        ${order.subtotal}
                      </span>
                    </div>
                  </div>

                  {/* Sub-Orders Breakdown */}
                  <div className="mt-3 space-y-3">
                    {order.subOrders.map((sub: any) => (
                      <div
                        key={sub.id}
                        className="p-3 rounded-lg bg-muted/30 border border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-semibold text-foreground">
                            <Store className="h-3.5 w-3.5 text-primary" />
                            {sub.dispensaryName}
                            <span className="text-[11px] text-muted-foreground font-normal">
                              ({sub.subOrderNumber})
                            </span>
                          </div>

                          <div className="mt-1 text-muted-foreground">
                            {sub.items.map((it: any) => `${it.quantity}x ${it.productName}`).join(', ')}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {sub.handoffUrl && (
                            <a
                              href={sub.handoffUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                            >
                              Store Handoff
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          <Link href={`/order/${order.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2.5 text-xs text-foreground font-semibold hover:bg-muted"
                            >
                              Track Order
                              <ChevronRight className="ml-1 h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

