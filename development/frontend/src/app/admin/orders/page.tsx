'use client';

import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Store,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  XCircle,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { AdminOrderDto } from '@/types/api.generated';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingSubOrderId, setUpdatingSubOrderId] = useState<string | null>(null);
  const [statusActionMessage, setStatusActionMessage] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.data.items);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [searchQuery, statusFilter]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const handleUpdateStatus = async (subOrderId: string, newStatus: string) => {
    setUpdatingSubOrderId(subOrderId);
    setStatusActionMessage(null);
    try {
      const res = await fetch(`/api/admin/sub-orders/${subOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusActionMessage(`Sub-order status updated to ${newStatus}.`);
        fetchOrders();
      }
    } finally {
      setUpdatingSubOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-[clamp(24px,3vw,34px)] leading-[1.08] tracking-[-0.01em] text-foreground">
            ORDERS & STORE OVERRIDES
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track multi-dispensary cannabis allocations, masked contact telemetry, and confirmation status.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order number (OWT-xxxxxx) or email..."
            className="pl-9 bg-card border-border text-foreground placeholder:text-muted h-11"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-card border border-border text-foreground rounded-md px-3 h-11 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">All Order Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="HANDED_OFF">HANDED_OFF</option>
          <option value="PARTIALLY_CONFIRMED">PARTIALLY_CONFIRMED</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Feedback banner */}
      {statusActionMessage && (
        <div
          role="status"
          className="p-3.5 rounded-lg bg-success/10 border border-success/30 text-success text-sm flex items-center gap-2.5"
        >
          <CheckCircle2 className="w-5 h-5 text-success" />
          <span>{statusActionMessage}</span>
        </div>
      )}

      {/* Orders List */}
      <Card className="bg-card border-border overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3 py-3 border-b border-border">
                <Skeleton className="h-6 w-36 bg-surface-muted" />
                <Skeleton className="h-4 w-64 bg-surface-muted" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="No Marketplace Orders Found"
              description="No orders match the current search or status filter."
            />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((o) => {
              const isExpanded = expandedOrderId === o.id;

              return (
                <div key={o.id} className="p-5 hover:bg-surface-muted transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-base font-bold text-success">
                          {o.orderNumber}
                        </span>
                        <Badge
                          className={`text-xs ${
                            o.status === 'CONFIRMED'
                              ? 'bg-success/10 text-success border border-success/30'
                              : o.status === 'HANDED_OFF'
                              ? 'bg-info/10 text-info border border-info/30'
                              : o.status === 'CANCELLED'
                              ? 'bg-danger/10 text-danger border border-danger/30'
                              : 'bg-warning/15 text-warning-foreground border border-warning/40'
                          }`}
                        >
                          {o.status}
                        </Badge>
                        <Badge className="bg-surface-muted border border-border text-muted-foreground text-xs">
                          {o.fulfillmentType === 'DELIVERY' ? (
                            <span className="flex items-center gap-1">
                              <Truck className="w-3 h-3 text-success" />
                              Delivery
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Store className="w-3 h-3 text-success" />
                              Pickup
                            </span>
                          )}
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>
                          Customer:{' '}
                          <strong className="text-foreground">{o.contactName || 'Guest'}</strong> (
                          {o.contactEmailMasked})
                        </span>
                        <span>Phone: {o.contactPhoneMasked}</span>
                        <span>
                          Created: {new Date(o.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4">
                      <div className="text-right">
                        <div className="text-base font-black text-foreground font-mono">
                          ${o.subtotal.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted">
                          {o.itemCount} items · {o.subOrderCount} store allocation(s)
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpand(o.id)}
                        className="border-border text-muted-foreground hover:text-success hover:border-primary h-9 px-3"
                      >
                        {isExpanded ? (
                          <>
                            Collapse
                            <ChevronUp className="w-4 h-4 ml-1" />
                          </>
                        ) : (
                          <>
                            Details
                            <ChevronDown className="w-4 h-4 ml-1" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Sub-Orders & Status Overrides */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border space-y-4 animate-in fade-in duration-200">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-success">
                        Dispensary Sub-Orders & Assignment
                      </h4>

                      <div className="grid grid-cols-1 gap-3">
                        {o.subOrders.map((so) => (
                          <div
                            key={so.id}
                            className="p-4 rounded-xl bg-background border border-border space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Store className="w-4 h-4 text-success" />
                                <span className="font-bold text-foreground text-sm">
                                  {so.dispensaryName}
                                </span>
                                <Badge className="text-xs bg-surface-muted border border-border text-muted-foreground">
                                  Status: {so.status}
                                </Badge>
                                {so.confirmationRef && (
                                  <Badge className="bg-success/10 text-success text-xs font-mono">
                                    Ref: {so.confirmationRef}
                                  </Badge>
                                )}
                              </div>

                              <div className="text-xs font-mono text-foreground">
                                Subtotal: ${so.subtotal.toFixed(2)}
                              </div>
                            </div>

                            {/* Line items list */}
                            <div className="space-y-1 pl-6 border-l-2 border-border">
                              {so.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="text-xs text-muted-foreground flex justify-between"
                                >
                                  <span>
                                    {item.quantity}× {item.productName}
                                  </span>
                                  <span className="font-mono text-foreground">
                                    ${item.lineTotal.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Status Override Actions */}
                            <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="text-muted">
                                Manual Store Confirmation Override:
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  disabled={updatingSubOrderId === so.id || so.status === 'CONFIRMED'}
                                  onClick={() => handleUpdateStatus(so.id, 'CONFIRMED')}
                                  className="bg-success hover:bg-success text-owtlet-mist h-7 text-xs px-2.5"
                                >
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  disabled={updatingSubOrderId === so.id || so.status === 'HANDED_OFF'}
                                  onClick={() => handleUpdateStatus(so.id, 'HANDED_OFF')}
                                  className="bg-info hover:bg-info text-owtlet-mist h-7 text-xs px-2.5"
                                >
                                  Handed Off
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={updatingSubOrderId === so.id || so.status === 'CANCELLED'}
                                  onClick={() => handleUpdateStatus(so.id, 'CANCELLED')}
                                  className="border-danger/30 text-danger hover:bg-danger/10 h-7 text-xs px-2.5"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

