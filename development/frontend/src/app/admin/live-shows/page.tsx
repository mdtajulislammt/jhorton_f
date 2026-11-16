'use client';

import React, { useEffect, useState } from 'react';
import {
  Tv,
  Plus,
  Play,
  Square,
  Pin,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Tag,
  DollarSign,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { AdminLiveShowDto, AdminProductDto, AdminBrandDto } from '@/types/api.generated';

export default function AdminLiveShowsPage() {
  const [shows, setShows] = useState<AdminLiveShowDto[]>([]);
  const [products, setProducts] = useState<AdminProductDto[]>([]);
  const [brands, setBrands] = useState<AdminBrandDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Show Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showFormData, setShowFormData] = useState({
    title: '',
    description: '',
    format: 'LIVE_SHOW',
    brandId: '',
    embeddingId: 'Cki70GhqvLgWGhJbSxg2',
    scheduledAt: '',
  });

  // Product Pinning Modal state
  const [pinningShow, setPinningShow] = useState<AdminLiveShowDto | null>(null);
  const [pinningError, setPinningError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchShowsAndData = async () => {
    setIsLoading(true);
    try {
      const [showsRes, prodsRes, brandsRes] = await Promise.all([
        fetch('/api/admin/live-shows').then((r) => r.json()),
        fetch('/api/admin/products').then((r) => r.json()),
        fetch('/api/admin/brands').then((r) => r.json()),
      ]);

      if (showsRes.success) setShows(showsRes.data.items);
      if (prodsRes.success) setProducts(prodsRes.data.items);
      if (brandsRes.success) setBrands(brandsRes.data.items);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShowsAndData();
  }, []);

  const handleStartShow = async (showId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/live-shows/${showId}/start`, { method: 'POST' });
      if (res.ok) await fetchShowsAndData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndShow = async (showId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/live-shows/${showId}/end`, { method: 'POST' });
      if (res.ok) await fetchShowsAndData();
    } finally {
      setActionLoading(false);
    }
  };

  const handlePinProduct = async (showId: string, product: AdminProductDto) => {
    setPinningError(null);

    // Acceptance Criteria AC-ADM-01: Pinning without Owtlet price is blocked
    if (product.owtletPrice === null || product.owtletPrice === undefined) {
      setPinningError(
        `Cannot pin "${product.name}": product must have an Owtlet Price set before pinning to a live show (AC-ADM-01).`
      );
      return;
    }

    try {
      const res = await fetch(`/api/admin/live-shows/${showId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setPinningError(json.error?.message || 'Failed to pin product');
        return;
      }

      await fetchShowsAndData();
      // Update local modal show reference
      setPinningShow((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          pinnedProductsCount: prev.pinnedProductsCount + 1,
          products: [
            ...prev.products,
            {
              showId,
              productId: product.id,
              sortOrder: 0,
              product: {
                id: product.id,
                name: product.name,
                slug: product.slug,
                owtletPrice: product.owtletPrice,
                imageUrls: product.imageUrls,
              },
            },
          ],
        };
      });
    } catch {
      setPinningError('Network error while pinning product');
    }
  };

  const handleUnpinProduct = async (showId: string, productId: string) => {
    try {
      await fetch(`/api/admin/live-shows/${showId}/products/${productId}`, {
        method: 'DELETE',
      });
      await fetchShowsAndData();
      setPinningShow((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          pinnedProductsCount: Math.max(0, prev.pinnedProductsCount - 1),
          products: prev.products.filter((p) => p.productId !== productId),
        };
      });
    } catch {}
  };

  const handleCreateShowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/live-shows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: showFormData.title,
          description: showFormData.description || null,
          format: showFormData.format,
          brandId: showFormData.brandId || null,
          embeddingId: showFormData.embeddingId,
          scheduledAt: showFormData.scheduledAt ? new Date(showFormData.scheduledAt).toISOString() : null,
        }),
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        fetchShowsAndData();
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-['Dela_Gothic_One'] tracking-tight">
            LIVE SHOWS & SHOPPABLE VIDEO
          </h1>
          <p className="text-[#BBD7D1] text-sm mt-1">
            Broadcast streaming controls, product pinning with single Owtlet pricing, and cart hold timers.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#70F1C7] hover:bg-[#85ffda] text-[#0D221E] font-bold h-11 px-5 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule Live Show
        </Button>
      </div>

      {/* Shows List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="bg-[#0D221E] border-[#1A3832]">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-48 bg-[#122A25]" />
                <Skeleton className="h-4 w-32 bg-[#122A25]" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : shows.length === 0 ? (
        <div className="py-12">
          <EmptyState
            title="No Live Shows Configured"
            description="Schedule a new Terrific Live shopping event or shoppable video session."
            action={{
              label: 'Schedule Live Show',
              onClick: () => setIsCreateModalOpen(true),
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {shows.map((s) => {
            const isLive = s.status === 'LIVE';

            return (
              <Card
                key={s.id}
                className={`bg-[#0D221E] border transition-all ${
                  isLive ? 'border-[#70F1C7] shadow-lg shadow-[#70F1C7]/10' : 'border-[#1A3832]'
                }`}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white font-['Dela_Gothic_One']">
                          {s.title}
                        </h3>
                        {isLive && (
                          <Badge className="bg-red-600 text-white animate-pulse text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                            <Radio className="w-3 h-3 mr-1 inline" />
                            LIVE NOW
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-[#BBD7D1]/70 font-mono mt-0.5">
                        Embed ID: {s.embeddingId}
                      </div>
                    </div>

                    <Badge
                      className={`text-xs ${
                        isLive
                          ? 'bg-red-950/80 text-red-300 border border-red-700'
                          : s.status === 'REPLAY'
                          ? 'bg-blue-950/60 text-blue-300 border border-blue-800'
                          : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {s.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-[#BBD7D1] line-clamp-2">
                    {s.description || 'Live cannabis shopping stream hosted on Owtlet.'}
                  </p>

                  <div className="pt-2 border-t border-[#1A3832] flex items-center justify-between text-xs text-[#BBD7D1]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#70F1C7]" />
                      <span>{s.scheduledAt ? new Date(s.scheduledAt).toLocaleString() : 'On Demand'}</span>
                    </div>
                    <span className="font-mono text-white font-semibold">
                      {s.pinnedProductsCount} pinned products
                    </span>
                  </div>

                  {/* Show Actions */}
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    {isLive ? (
                      <Button
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => handleEndShow(s.id)}
                        className="bg-red-800 hover:bg-red-700 text-white font-bold h-9 text-xs px-4"
                      >
                        <Square className="w-3.5 h-3.5 mr-1.5" />
                        End Live Stream
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => handleStartShow(s.id)}
                        className="bg-[#70F1C7] hover:bg-[#85ffda] text-[#0D221E] font-bold h-9 text-xs px-4"
                      >
                        <Play className="w-3.5 h-3.5 mr-1.5" />
                        Go Live Now
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPinningShow(s);
                        setPinningError(null);
                      }}
                      className="border-[#1A3832] text-white hover:text-[#70F1C7] hover:border-[#70F1C7] h-9 text-xs px-3"
                    >
                      <Pin className="w-3.5 h-3.5 mr-1.5" />
                      Manage Pinned Products ({s.pinnedProductsCount})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Product Pinning Dialog (AC-ADM-01) */}
      {pinningShow && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0D221E] border border-[#1A3832] rounded-2xl max-w-3xl w-full p-6 text-white space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1A3832] pb-4">
              <div>
                <h2 className="text-xl font-bold font-['Dela_Gothic_One']">
                  Pin Products to Show
                </h2>
                <p className="text-xs text-[#BBD7D1] mt-0.5">
                  Stream: <strong className="text-white">{pinningShow.title}</strong>
                </p>
              </div>
              <button
                onClick={() => setPinningShow(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {pinningError && (
              <div
                role="alert"
                className="p-3.5 rounded-lg bg-red-950/60 border border-red-800 text-red-200 text-sm flex items-start gap-2.5"
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                <span>{pinningError}</span>
              </div>
            )}

            {/* Invariant Note */}
            <div className="p-3 rounded-lg bg-[#071311] border border-[#1A3832] text-xs text-[#BBD7D1] space-y-1">
              <div className="font-bold text-[#70F1C7]">
                Live Uniform Pricing Policy (AC-ADM-01):
              </div>
              <p>
                Products pinned in live shows MUST have an Owtlet Price configured. When pinned, this uniform price applies across all partner dispensaries throughout the live broadcast.
              </p>
            </div>

            {/* Currently Pinned Products */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-white">
                Currently Pinned ({pinningShow.products.length})
              </div>
              {pinningShow.products.length === 0 ? (
                <div className="text-xs text-gray-400 italic py-2">
                  No products pinned to this show yet. Select from available products below.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {pinningShow.products.map((p) => (
                    <div
                      key={p.productId}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#071311] border border-[#1A3832]"
                    >
                      <div className="flex items-center gap-3">
                        <Pin className="w-4 h-4 text-[#70F1C7]" />
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {p.product.name}
                          </div>
                          <div className="text-xs text-[#70F1C7] font-mono">
                            Owtlet Uniform Price: ${p.product.owtletPrice?.toFixed(2) || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnpinProduct(pinningShow.id, p.productId)}
                        className="border-red-900 text-red-400 hover:bg-red-950 h-7 text-xs px-2.5"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Unpin
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Products to Pin */}
            <div className="space-y-2 pt-3 border-t border-[#1A3832]">
              <div className="text-xs font-bold uppercase tracking-wider text-white">
                Available Catalog Products
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {products
                  .filter((prod) => !pinningShow.products.some((p) => p.productId === prod.id))
                  .map((product) => {
                    const hasOwtletPrice = product.owtletPrice !== null && product.owtletPrice !== undefined;

                    return (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-[#071311] border border-[#1A3832]"
                      >
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {product.name}
                          </div>
                          <div className="text-xs text-[#BBD7D1]/70">
                            {product.brand?.name || 'Brand'} · {product.category?.name || 'Category'}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {hasOwtletPrice ? (
                            <span className="font-bold text-[#70F1C7] text-sm font-mono">
                              ${product.owtletPrice!.toFixed(2)}
                            </span>
                          ) : (
                            <Badge className="bg-amber-950/60 text-amber-400 border border-amber-800 text-[10px]">
                              Owtlet Price Missing
                            </Badge>
                          )}

                          <Button
                            size="sm"
                            disabled={!hasOwtletPrice}
                            onClick={() => handlePinProduct(pinningShow.id, product)}
                            className="bg-[#122A25] border border-[#1A3832] text-[#70F1C7] hover:bg-[#70F1C7] hover:text-[#0D221E] h-8 text-xs px-3 disabled:opacity-40"
                          >
                            <Pin className="w-3 h-3 mr-1" />
                            Pin to Show
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#1A3832]">
              <Button
                variant="outline"
                onClick={() => setPinningShow(null)}
                className="border-[#1A3832] text-[#BBD7D1] hover:text-white"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Show Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0D221E] border border-[#1A3832] rounded-2xl max-w-lg w-full p-6 text-white space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1A3832] pb-4">
              <h2 className="text-xl font-bold font-['Dela_Gothic_One']">
                Schedule Live Shopping Event
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateShowSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#BBD7D1]">
                  Show Title *
                </label>
                <Input
                  required
                  value={showFormData.title}
                  onChange={(e) => setShowFormData({ ...showFormData, title: e.target.value })}
                  placeholder="Friday Night Live Flower Drops"
                  className="bg-[#071311] border-[#1A3832] text-white h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#BBD7D1]">
                  Format
                </label>
                <select
                  value={showFormData.format}
                  onChange={(e) => setShowFormData({ ...showFormData, format: e.target.value })}
                  className="w-full bg-[#071311] border border-[#1A3832] text-white rounded-md px-3 h-10 text-sm"
                >
                  <option value="LIVE_SHOW">Live Shopping Stream</option>
                  <option value="SHOPPABLE_VIDEO">Shoppable Video Replay</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#BBD7D1]">
                  Partner Brand (Optional)
                </label>
                <select
                  value={showFormData.brandId}
                  onChange={(e) => setShowFormData({ ...showFormData, brandId: e.target.value })}
                  className="w-full bg-[#071311] border border-[#1A3832] text-white rounded-md px-3 h-10 text-sm"
                >
                  <option value="">Owtlet Multi-Brand Live</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#BBD7D1]">
                  Terrific Live Embedding ID
                </label>
                <Input
                  value={showFormData.embeddingId}
                  onChange={(e) => setShowFormData({ ...showFormData, embeddingId: e.target.value })}
                  placeholder="Cki70GhqvLgWGhJbSxg2"
                  className="bg-[#071311] border-[#1A3832] text-white h-10 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#BBD7D1]">
                  Scheduled Broadcast Time
                </label>
                <Input
                  type="datetime-local"
                  value={showFormData.scheduledAt}
                  onChange={(e) => setShowFormData({ ...showFormData, scheduledAt: e.target.value })}
                  className="bg-[#071311] border-[#1A3832] text-white h-10"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1A3832]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="border-[#1A3832] text-[#BBD7D1] hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-[#70F1C7] hover:bg-[#85ffda] text-[#0D221E] font-bold px-6 active:scale-[0.98]"
                >
                  Schedule Event
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
