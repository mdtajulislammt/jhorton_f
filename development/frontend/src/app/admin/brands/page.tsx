'use client';

import React, { useEffect, useState } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Store,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { AdminBrandDto, AdminDispensaryDto } from '@/types/api.generated';

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<AdminBrandDto[]>([]);
  const [dispensaries, setDispensaries] = useState<AdminDispensaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<AdminBrandDto | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logoUrl: '',
    bannerUrl: '',
    sortOrder: 0,
    isActive: true,
    dispensaryIds: [] as string[],
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBrandsAndStores = async () => {
    setIsLoading(true);
    try {
      const [brandRes, dispRes] = await Promise.all([
        fetch('/api/admin/brands').then((r) => r.json()),
        fetch('/api/admin/dispensaries').then((r) => r.json()),
      ]);

      if (brandRes.success) setBrands(brandRes.data.items);
      if (dispRes.success) setDispensaries(dispRes.data.items);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrandsAndStores();
  }, []);

  const openCreateModal = () => {
    setEditingBrand(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      logoUrl: '',
      bannerUrl: '',
      sortOrder: brands.length + 1,
      isActive: false, // Default inactive until >= 1 store assigned
      dispensaryIds: dispensaries.length > 0 ? [dispensaries[0].id] : [],
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (b: AdminBrandDto) => {
    setEditingBrand(b);
    setFormData({
      name: b.name,
      slug: b.slug,
      description: b.description || '',
      logoUrl: b.logoUrl || '',
      bannerUrl: b.bannerUrl || '',
      sortOrder: b.sortOrder,
      isActive: b.isActive,
      dispensaryIds: b.dispensaries.map((d) => d.id),
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const toggleDispensarySelection = (dispensaryId: string) => {
    setFormData((prev) => {
      const exists = prev.dispensaryIds.includes(dispensaryId);
      const nextIds = exists
        ? prev.dispensaryIds.filter((id) => id !== dispensaryId)
        : [...prev.dispensaryIds, dispensaryId];

      // If user unselects all stores, auto-turn off isActive
      const nextActive = nextIds.length === 0 ? false : prev.isActive;

      return {
        ...prev,
        dispensaryIds: nextIds,
        isActive: nextActive,
      };
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Acceptance Criteria AC-BRD-01: Block activation with 0 stores
    if (formData.isActive && formData.dispensaryIds.length === 0) {
      setFormError('Brand cannot be activated without at least one assigned partner dispensary (AC-BRD-01).');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingBrand) {
        // 1. Update brand info
        const resBrand = await fetch(`/api/admin/brands/${editingBrand.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            slug: formData.slug || undefined,
            description: formData.description || null,
            logoUrl: formData.logoUrl || null,
            bannerUrl: formData.bannerUrl || null,
            sortOrder: formData.sortOrder,
            isActive: formData.isActive,
          }),
        });

        const brandJson = await resBrand.json();
        if (!resBrand.ok || !brandJson.success) {
          setFormError(brandJson.error?.message || 'Failed to update brand');
          setIsSubmitting(false);
          return;
        }

        // 2. Assign partner dispensaries
        const resStores = await fetch(`/api/admin/brands/${editingBrand.id}/dispensaries`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dispensaryIds: formData.dispensaryIds }),
        });

        const storeJson = await resStores.json();
        if (!resStores.ok || !storeJson.success) {
          setFormError(storeJson.error?.message || 'Failed to assign partner dispensaries');
          setIsSubmitting(false);
          return;
        }
      } else {
        // Create brand with assigned stores
        const res = await fetch('/api/admin/brands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          setFormError(json.error?.message || 'Failed to create brand');
          setIsSubmitting(false);
          return;
        }
      }

      setIsModalOpen(false);
      fetchBrandsAndStores();
    } catch {
      setFormError('Network communication error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-[clamp(24px,3vw,34px)] leading-[1.08] tracking-[-0.01em] text-foreground">
            BRAND CHANNELS
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage brand storefront channels and assigned partner dispensary fulfillment mappings.
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-primary hover:bg-primary-hover text-primary-foreground font-bold h-11 px-5 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Brand Channel
        </Button>
      </div>

      {/* Brands Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-32 bg-surface-muted" />
                <Skeleton className="h-4 w-48 bg-surface-muted" />
                <Skeleton className="h-8 w-24 bg-surface-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="py-12">
          <EmptyState
            title="No Brand Channels Configured"
            description="Create brand storefronts and link them to partner dispensaries for localized fulfillment."
            action={{
              label: 'Add Brand Channel',
              onClick: openCreateModal,
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {brands.map((b) => (
            <Card
              key={b.id}
              className="bg-card border-border hover:border-primary/50 transition-all flex flex-col justify-between"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold leading-tight text-foreground">
                      {b.name}
                    </h3>
                    <div className="text-xs text-muted font-mono mt-0.5">
                      /brands/{b.slug}
                    </div>
                  </div>
                  {b.isActive ? (
                    <Badge className="bg-success/10 text-success border border-success/30 text-xs">
                      Active Channel
                    </Badge>
                  ) : (
                    <Badge className="bg-surface-muted text-muted text-xs">Inactive</Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">
                  {b.description || 'Verified licensed cannabis brand partner on Owtlet.'}
                </p>

                {/* Partner Dispensaries Mapped */}
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <div className="text-xs font-semibold uppercase tracking-wider text-success flex items-center justify-between">
                    <span>Assigned Dispensaries</span>
                    <span className="font-mono text-foreground">{b.dispensariesCount}</span>
                  </div>
                  {b.dispensaries.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {b.dispensaries.map((d) => (
                        <span
                          key={d.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-muted text-xs text-muted-foreground"
                        >
                          <Store className="w-3 h-3 text-success" />
                          {d.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-warning-foreground italic flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      No stores assigned (Channel disabled)
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted">
                  <span>{b.productsCount} Products</span>
                  <span>{b.showsCount} Shows</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(b)}
                  className="w-full bg-surface-muted border-border text-foreground hover:text-success hover:border-primary h-9 mt-2"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                  Edit Brand & Store Mappings
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-ink/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 text-foreground space-y-6 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-xl font-heading">
                {editingBrand ? `Edit Brand: ${editingBrand.name}` : 'Add Brand Channel'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="p-3.5 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm flex items-start gap-2.5"
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-danger" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Brand Name *
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Lowell Farms"
                    className="bg-background border-border text-foreground h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Channel Slug
                  </label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="lowell-farms"
                    className="bg-background border-border text-foreground h-10 font-mono"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Brand Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brand ethos, craft cultivation methods, and heritage..."
                    className="w-full bg-background border border-border rounded-md p-3 text-foreground text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* BrandDispensaryPicker (AC-BRD-01) */}
              <div className="p-4 rounded-xl bg-background border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-success flex items-center gap-1.5">
                    <Store className="w-4 h-4" />
                    Assign Partner Dispensaries (AC-BRD-01)
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {formData.dispensaryIds.length} stores selected
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Shoppers ordering from this brand storefront channel will be fulfilled exclusively by the selected partner stores.
                </p>

                <div className="space-y-2 max-h-48 overflow-y-auto pt-2">
                  {dispensaries.map((dispensary) => {
                    const isChecked = formData.dispensaryIds.includes(dispensary.id);
                    return (
                      <label
                        key={dispensary.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-surface-muted border-primary'
                            : 'bg-card border-border hover:border-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleDispensarySelection(dispensary.id)}
                            className="w-4 h-4 rounded text-success"
                          />
                          <div>
                            <div className="text-sm font-semibold text-foreground">
                              {dispensary.name}
                            </div>
                            <div className="text-xs text-muted">
                              {dispensary.city}, {dispensary.state} ({dispensary.zip})
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1.5">
                          {dispensary.offersPickup && (
                            <Badge className="bg-primary/15 text-success border border-primary/50 text-[10px]">
                              Pickup
                            </Badge>
                          )}
                          {dispensary.offersDelivery && (
                            <Badge className="bg-info/10 text-info border border-info/30 text-[10px]">
                              Delivery
                            </Badge>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Active Toggle & AC-BRD-01 Invariant Rule */}
              <div className="p-3 rounded-lg bg-background border border-border flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-foreground">Activate Storefront Channel</div>
                  <div className="text-xs text-muted-foreground">
                    {formData.dispensaryIds.length === 0 ? (
                      <span className="text-warning-foreground font-medium">
                        ⚠ Disabled: At least one partner dispensary required before activation (AC-BRD-01).
                      </span>
                    ) : (
                      'Brand channel will be publicly accessible at /brands/[slug].'
                    )}
                  </div>
                </div>

                <input
                  type="checkbox"
                  disabled={formData.dispensaryIds.length === 0}
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded text-success disabled:opacity-30 cursor-pointer"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-border text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary-hover text-primary-foreground font-bold px-6 active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Brand Channel'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
