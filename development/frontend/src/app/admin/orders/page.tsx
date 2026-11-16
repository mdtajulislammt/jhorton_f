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
          <h1 className="text-2xl font-black text-white font-['Dela_Gothic_One'] tracking-tight">
            ORDERS & STORE OVERRIDES
          </h1>
          <p className="text-[#BBD7D1] text-sm mt-1">
            Track multi-dispensary cannabis allocations, masked contact telemetry, and confirmation status.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BBD7D1]/60" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order number (OWT-xxxxxx) or email..."
            className="pl-9 bg-[#0D221E] border-[#1A3832] text-white placeholder:text-gray-500 h-11"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#0D221E] border border-[#1A3832] text-white rounded-md px-3 h-11 text-sm focus:border-[#70F1C7] focus:outline-none"
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
          className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-sm flex items-center gap-2.5"
        >
          <CheckCircle2 className="w-5 h-5 text-[#70F1C7]" />
          <span>{statusActionMessage}</span>
        </div>
      )}

      {/* Orders List */}
      <Card className="bg-[#0D221E] border-[#1A3832] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3 py-3 border-b border-[#1A3832]">
                <Skeleton className="h-6 w-36 bg-[#122A25]" />
                <Skeleton className="h-4 w-64 bg-[#122A25]" />
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
          <div className="divide-y divide-[#1A3832]">
            {orders.map((o) => {
              const isExpanded = expandedOrderId === o.id;

              return (
                <div key={o.id} className="p-5 hover:bg-[#122A25]/30 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-base font-bold text-[#70F1C7]">
                          {o.orderNumber}
                        </span>
                        <Badge
                          className={`text-xs ${
                            o.status === 'CONFIRMED'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                              : o.status === 'HANDED_OFF'
                              ? 'bg-blue-950/60 text-blue-400 border border-blue-800'
                              : o.status === 'CANCELLED'
                              ? 'bg-red-950/60 text-red-400 border border-red-800'
                              : 'bg-amber-950/60 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {o.status}
                        </Badge>
                        <Badge className="bg-[#122A25] border border-[#1A3832] text-[#BBD7D1] text-xs">
                          {o.fulfillmentType === 'DELIVERY' ? (
                            <span className="flex items-center gap-1">
                              <Truck className="w-3 h-3 text-[#70F1C7]" />
                              Delivery
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Store className="w-3 h-3 text-[#70F1C7]" />
                              Pickup
                            </span>
                          )}
                        </Badge>
                      </div>

                      <div className="text-xs text-[#BBD7D1] flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>
                          Customer:{' '}
                          <strong className="text-white">{o.contactName || 'Guest'}</strong> (
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
                        <div className="text-base font-black text-white font-mono">
                          ${o.subtotal.toFixed(2)}
                        </div>
                        <div className="text-xs text-[#BBD7D1]/60">
                          {o.itemCount} items · {o.subOrderCount} store allocation(s)
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpand(o.id)}
                        className="border-[#1A3832] text-[#BBD7D1] hover:text-[#70F1C7] hover:border-[#70F1C7] h-9 px-3"
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
                    <div className="mt-4 pt-4 border-t border-[#1A3832] space-y-4 animate-in fade-in duration-200">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#70F1C7]">
                        Dispensary Sub-Orders & Assignment
                      </h4>

                      <div className="grid grid-cols-1 gap-3">
                        {o.subOrders.map((so) => (
                          <div
                            key={so.id}
                            className="p-4 rounded-xl bg-[#071311] border border-[#1A3832] space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Store className="w-4 h-4 text-[#70F1C7]" />
                                <span className="font-bold text-white text-sm">
                                  {so.dispensaryName}
                                </span>
                                <Badge className="text-xs bg-[#122A25] border border-[#1A3832] text-[#BBD7D1]">
                                  Status: {so.status}
                                </Badge>
                                {so.confirmationRef && (
                                  <Badge className="bg-emerald-950/60 text-emerald-400 text-xs font-mono">
                                    Ref: {so.confirmationRef}
                                  </Badge>
                                )}
                              </div>

                              <div className="text-xs font-mono text-white">
                                Subtotal: ${so.subtotal.toFixed(2)}
                              </div>
                            </div>

                            {/* Line items list */}
                            <div className="space-y-1 pl-6 border-l-2 border-[#1A3832]">
                              {so.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="text-xs text-[#BBD7D1] flex justify-between"
                                >
                                  <span>
                                    {item.quantity}× {item.productName}
                                  </span>
                                  <span className="font-mono text-white">
                                    ${item.lineTotal.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Status Override Actions */}
                            <div className="pt-2 border-t border-[#1A3832]/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="text-gray-400">
                                Manual Store Confirmation Override:
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  disabled={updatingSubOrderId === so.id || so.status === 'CONFIRMED'}
                                  onClick={() => handleUpdateStatus(so.id, 'CONFIRMED')}
                                  className="bg-emerald-800 hover:bg-emerald-700 text-white h-7 text-xs px-2.5"
                                >
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  disabled={updatingSubOrderId === so.id || so.status === 'HANDED_OFF'}
                                  onClick={() => handleUpdateStatus(so.id, 'HANDED_OFF')}
                                  className="bg-blue-800 hover:bg-blue-700 text-white h-7 text-xs px-2.5"
                                >
                                  Handed Off
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={updatingSubOrderId === so.id || so.status === 'CANCELLED'}
                                  onClick={() => handleUpdateStatus(so.id, 'CANCELLED')}
                                  className="border-red-900 text-red-400 hover:bg-red-950 h-7 text-xs px-2.5"
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

