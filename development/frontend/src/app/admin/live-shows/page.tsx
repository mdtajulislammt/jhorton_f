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
          <h1 className="font-heading text-[clamp(24px,3vw,34px)] leading-[1.08] tracking-[-0.01em] text-foreground">
            LIVE SHOWS & SHOPPABLE VIDEO
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Broadcast streaming controls, product pinning with single Owtlet pricing, and cart hold timers.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary hover:bg-primary-hover text-primary-foreground font-bold h-11 px-5 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule Live Show
        </Button>
      </div>

      {/* Shows List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-48 bg-surface-muted" />
                <Skeleton className="h-4 w-32 bg-surface-muted" />
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
                className={`bg-card border transition-all ${
                  isLive ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'
                }`}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold leading-tight text-foreground">
                          {s.title}
                        </h3>
                      </div>
                      <div className="text-xs text-muted font-mono mt-0.5">
                        Embed ID: {s.embeddingId}
                      </div>
                    </div>

                    <Badge
                      className={`shrink-0 gap-1.5 whitespace-nowrap border-0 text-[10.5px] font-bold tracking-[0.08em] ${
                        isLive
                          ? 'bg-accent text-accent-foreground'
                          : s.status === 'REPLAY'
                          ? 'bg-ink text-owtlet-mist'
                          : 'bg-strain-sativa text-owtlet-ink'
                      }`}
                    >
                      {isLive ? <span className="h-1.5 w-1.5 rounded-full bg-accent-foreground motion-safe:animate-pulse" aria-hidden="true" /> : null}
                      {isLive ? 'LIVE NOW' : s.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {s.description || 'Live cannabis shopping stream hosted on Owtlet.'}
                  </p>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-success" />
                      <span>{s.scheduledAt ? new Date(s.scheduledAt).toLocaleString() : 'On Demand'}</span>
                    </div>
                    <span className="font-mono text-foreground font-semibold">
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
                        className="bg-danger hover:bg-danger text-owtlet-mist font-bold h-9 text-xs px-4"
                      >
                        <Square className="w-3.5 h-3.5 mr-1.5" />
                        End Live Stream
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => handleStartShow(s.id)}
                        className="bg-primary hover:bg-primary-hover text-primary-foreground font-bold h-9 text-xs px-4"
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
                      className="border-border text-foreground hover:text-success hover:border-primary h-9 text-xs px-3"
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
        <div className="fixed inset-0 bg-ink/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-3xl w-full p-6 text-foreground space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-xl font-heading">
                  Pin Products to Show
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Stream: <strong className="text-foreground">{pinningShow.title}</strong>
                </p>
              </div>
              <button
                onClick={() => setPinningShow(null)}
                className="text-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {pinningError && (
              <div
                role="alert"
                className="p-3.5 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm flex items-start gap-2.5"
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-danger" />
                <span>{pinningError}</span>
              </div>
            )}

            {/* Invariant Note */}
            <div className="p-3 rounded-lg bg-background border border-border text-xs text-muted-foreground space-y-1">
              <div className="font-bold text-success">
                Live Uniform Pricing Policy (AC-ADM-01):
              </div>
              <p>
                Products pinned in live shows MUST have an Owtlet Price configured. When pinned, this uniform price applies across all partner dispensaries throughout the live broadcast.
              </p>
            </div>

            {/* Currently Pinned Products */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-foreground">
                Currently Pinned ({pinningShow.products.length})
              </div>
              {pinningShow.products.length === 0 ? (
                <div className="text-xs text-muted italic py-2">
                  No products pinned to this show yet. Select from available products below.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {pinningShow.products.map((p) => (
                    <div
                      key={p.productId}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <Pin className="w-4 h-4 text-success" />
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {p.product.name}
                          </div>
                          <div className="text-xs text-success font-mono">
                            Owtlet Uniform Price: ${p.product.owtletPrice?.toFixed(2) || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnpinProduct(pinningShow.id, p.productId)}
                        className="border-danger/30 text-danger hover:bg-danger/10 h-7 text-xs px-2.5"
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
            <div className="space-y-2 pt-3 border-t border-border">
              <div className="text-xs font-bold uppercase tracking-wider text-foreground">
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
                        className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border"
                      >
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {product.name}
                          </div>
                          <div className="text-xs text-muted">
                            {product.brand?.name || 'Brand'} · {product.category?.name || 'Category'}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {hasOwtletPrice ? (
                            <span className="font-bold text-success text-sm font-mono">
                              ${product.owtletPrice!.toFixed(2)}
                            </span>
                          ) : (
                            <Badge className="bg-warning/15 text-warning-foreground border border-warning/40 text-[10px]">
                              Owtlet Price Missing
                            </Badge>
                          )}

                          <Button
                            size="sm"
                            disabled={!hasOwtletPrice}
                            onClick={() => handlePinProduct(pinningShow.id, product)}
                            className="bg-surface-muted border border-border text-success hover:bg-primary hover:text-primary-foreground h-8 text-xs px-3 disabled:opacity-40"
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

            <div className="flex justify-end pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setPinningShow(null)}
                className="border-border text-muted-foreground hover:text-foreground"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Show Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-ink/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 text-foreground space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-xl font-heading">
                Schedule Live Shopping Event
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateShowSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Show Title *
                </label>
                <Input
                  required
                  value={showFormData.title}
                  onChange={(e) => setShowFormData({ ...showFormData, title: e.target.value })}
                  placeholder="Friday Night Live Flower Drops"
                  className="bg-background border-border text-foreground h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Format
                </label>
                <select
                  value={showFormData.format}
                  onChange={(e) => setShowFormData({ ...showFormData, format: e.target.value })}
                  className="w-full bg-background border border-border text-foreground rounded-md px-3 h-10 text-sm"
                >
                  <option value="LIVE_SHOW">Live Shopping Stream</option>
                  <option value="SHOPPABLE_VIDEO">Shoppable Video Replay</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Partner Brand (Optional)
                </label>
                <select
                  value={showFormData.brandId}
                  onChange={(e) => setShowFormData({ ...showFormData, brandId: e.target.value })}
                  className="w-full bg-background border border-border text-foreground rounded-md px-3 h-10 text-sm"
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
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Terrific Live Embedding ID
                </label>
                <Input
                  value={showFormData.embeddingId}
                  onChange={(e) => setShowFormData({ ...showFormData, embeddingId: e.target.value })}
                  placeholder="Cki70GhqvLgWGhJbSxg2"
                  className="bg-background border-border text-foreground h-10 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Scheduled Broadcast Time
                </label>
                <Input
                  type="datetime-local"
                  value={showFormData.scheduledAt}
                  onChange={(e) => setShowFormData({ ...showFormData, scheduledAt: e.target.value })}
                  className="bg-background border-border text-foreground h-10"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="border-border text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-primary hover:bg-primary-hover text-primary-foreground font-bold px-6 active:scale-[0.98]"
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
