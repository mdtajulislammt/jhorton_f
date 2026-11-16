'use client';

import React, { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Tv,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  DollarSign,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { AdminProductDto } from '@/types/api.generated';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductDto[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [strains, setStrains] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProductDto | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    brandId: '',
    categoryId: '',
    strainId: '',
    thcPercent: '',
    cbdPercent: '',
    weightGrams: '',
    owtletPrice: '',
    sku: '',
    terrificProductId: '',
    isActive: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (selectedBrand) params.set('brandId', selectedBrand);
      if (selectedCategory) params.set('categoryId', selectedCategory);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data.items);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedBrand, selectedCategory]);

  useEffect(() => {
    // Load metadata (brands, categories)
    fetch('/api/admin/brands')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setBrands(data.data.items);
      })
      .catch(() => {});

    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.items) {
          // Extract unique categories and strains from catalog
          const catMap = new Map();
          const strMap = new Map();
          data.data.items.forEach((p: any) => {
            if (p.category) catMap.set(p.category.id, p.category);
            if (p.strain) strMap.set(p.strain.id, p.strain);
          });
          setCategories(Array.from(catMap.values()));
          setStrains(Array.from(strMap.values()));
        }
      })
      .catch(() => {});
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      brandId: brands[0]?.id || '',
      categoryId: categories[0]?.id || '',
      strainId: strains[0]?.id || '',
      thcPercent: '',
      cbdPercent: '',
      weightGrams: '3.5',
      owtletPrice: '',
      sku: '',
      terrificProductId: '',
      isActive: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: AdminProductDto) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      slug: p.slug,
      description: p.description || '',
      brandId: p.brandId || '',
      categoryId: p.categoryId,
      strainId: p.strainId || '',
      thcPercent: p.thcPercent ? String(p.thcPercent) : '',
      cbdPercent: p.cbdPercent ? String(p.cbdPercent) : '',
      weightGrams: p.weightGrams ? String(p.weightGrams) : '',
      owtletPrice: p.owtletPrice ? String(p.owtletPrice) : '',
      sku: p.sku || '',
      terrificProductId: p.terrificProductId || '',
      isActive: p.isActive,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation: If pinned in active show, owtletPrice cannot be empty
    if (editingProduct?.isPinnedInActiveShow && (!formData.owtletPrice || Number(formData.owtletPrice) <= 0)) {
      setFormError('Cannot remove Owtlet price: product is pinned in a live show (AC-ADM-01).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formData.name,
        slug: formData.slug || undefined,
        description: formData.description || null,
        brandId: formData.brandId || null,
        categoryId: formData.categoryId,
        strainId: formData.strainId || null,
        thcPercent: formData.thcPercent ? Number(formData.thcPercent) : null,
        cbdPercent: formData.cbdPercent ? Number(formData.cbdPercent) : null,
        weightGrams: formData.weightGrams ? Number(formData.weightGrams) : null,
        owtletPrice: formData.owtletPrice ? Number(formData.owtletPrice) : null,
        sku: formData.sku || null,
        terrificProductId: formData.terrificProductId || null,
        isActive: formData.isActive,
      };

      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products';
      const method = editingProduct ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setFormError(json.error?.message || 'Failed to save product');
        setIsSubmitting(false);
        return;
      }

      setIsModalOpen(false);
      fetchProducts();
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
          <h1 className="text-2xl font-black text-white font-['Dela_Gothic_One'] tracking-tight">
            PRODUCTS & PRICING
          </h1>
          <p className="text-[#BBD7D1] text-sm mt-1">
            Manage cannabis strains, inventory details, and uniform Owtlet live show pricing.
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-[#70F1C7] hover:bg-[#85ffda] text-[#0D221E] font-bold h-11 px-5 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Cannabis Product
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BBD7D1]/60" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, SKU, or slug..."
            className="pl-9 bg-[#0D221E] border-[#1A3832] text-white placeholder:text-gray-500 h-11"
          />
        </div>

        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="bg-[#0D221E] border border-[#1A3832] text-white rounded-md px-3 h-11 text-sm focus:border-[#70F1C7] focus:outline-none"
        >
          <option value="">All Partner Brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-[#0D221E] border border-[#1A3832] text-white rounded-md px-3 h-11 text-sm focus:border-[#70F1C7] focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <Card className="bg-[#0D221E] border-[#1A3832] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[#1A3832]">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48 bg-[#122A25]" />
                  <Skeleton className="h-4 w-32 bg-[#122A25]" />
                </div>
                <Skeleton className="h-8 w-20 bg-[#122A25]" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="No Cannabis Products Found"
              description="No products match the selected filters. Clear your search or add a new cannabis item."
              action={{
                label: 'Add New Product',
                onClick: openCreateModal,
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#071311] border-b border-[#1A3832] text-[#BBD7D1] uppercase text-xs">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Brand & Category</th>
                  <th className="py-3 px-4">Potency (THC)</th>
                  <th className="py-3 px-4">Owtlet Price</th>
                  <th className="py-3 px-4">Total Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A3832]">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-[#122A25]/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div>{p.name}</div>
                      <div className="text-xs text-[#BBD7D1]/60 font-mono">
                        {p.sku || p.slug}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#BBD7D1]">
                      <div className="font-medium">{p.brand?.name || 'Independent'}</div>
                      <div className="text-xs text-[#BBD7D1]/70">{p.category?.name || 'Cannabis'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-white font-mono">
                      {p.thcPercent ? `${p.thcPercent}% THC` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.owtletPrice !== null ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#70F1C7] text-base">
                            ${p.owtletPrice.toFixed(2)}
                          </span>
                          <Badge className="bg-[#70F1C7]/10 text-[#70F1C7] border border-[#70F1C7]/30 text-[10px] px-1.5 py-0">
                            Uniform
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-xs text-[#BBD7D1]/60 italic">Per-store</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className={p.totalStock > 0 ? 'text-white' : 'text-red-400 font-bold'}>
                        {p.totalStock} units
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {p.isActive ? (
                          <Badge className="bg-emerald-950/60 text-emerald-400 border border-emerald-800 text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-800 text-gray-400 text-xs">Inactive</Badge>
                        )}
                        {p.isPinnedInActiveShow && (
                          <Badge className="bg-amber-950/60 text-amber-400 border border-amber-800 text-xs flex items-center gap-1">
                            <Tv className="w-3 h-3" />
                            Live Pinned
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(p)}
                        className="bg-transparent border-[#1A3832] text-[#BBD7D1] hover:text-[#70F1C7] hover:border-[#70F1C7] h-8 px-3"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0D221E] border border-[#1A3832] rounded-2xl max-w-2xl w-full p-6 text-white space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1A3832] pb-4">
              <h2 className="text-xl font-bold font-['Dela_Gothic_One']">
                {editingProduct ? 'Edit Cannabis Product' : 'Add New Cannabis Product'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="p-3.5 rounded-lg bg-red-950/60 border border-red-800 text-red-200 text-sm flex items-start gap-2.5"
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#BBD7D1]">
                    Product Name *
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sour Diesel Live Resin"
                    className="bg-[#071311] border-[#1A3832] text-white h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#BBD7D1]">
                    Slug (URL identifier)
                  </label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="sour-diesel-live-resin"
                    className="bg-[#071311] border-[#1A3832] text-white h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#BBD7D1]">
                    Brand
                  </label>
                  <select
                    value={formData.brandId}
                    onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                    className="w-full bg-[#071311] border border-[#1A3832] text-white rounded-md px-3 h-10 text-sm"
                  >
                    <option value="">Independent / None</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#BBD7D1]">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-[#071311] border border-[#1A3832] text-white rounded-md px-3 h-10 text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#BBD7D1]">
                    THC Percentage (%)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.thcPercent}
                    onChange={(e) => setFormData({ ...formData, thcPercent: e.target.value })}
                    placeholder="28.5"
                    className="bg-[#071311] border-[#1A3832] text-white h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#BBD7D1]">
                    Owtlet Price ($) — Uniform Show Pricing
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.owtletPrice}
                    onChange={(e) => setFormData({ ...formData, owtletPrice: e.target.value })}
                    placeholder="e.g. 45.00"
                    className="bg-[#071311] border-[#1A3832] text-[#70F1C7] font-bold h-10"
                  />
                  {editingProduct?.isPinnedInActiveShow && (
                    <p className="text-[11px] text-amber-400">
                      ⚠ Product is pinned in a live show. Owtlet price cannot be blank (AC-ADM-01).
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#BBD7D1]">
                    SKU Code
                  </label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="SKU-THC-001"
                    className="bg-[#071311] border-[#1A3832] text-white h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#BBD7D1]">
                    Terrific Live Product ID
                  </label>
                  <Input
                    value={formData.terrificProductId}
                    onChange={(e) => setFormData({ ...formData, terrificProductId: e.target.value })}
                    placeholder="trf-prod-xxx"
                    className="bg-[#071311] border-[#1A3832] text-white h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#BBD7D1]">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Terpene notes, aroma, and licensed compliance details..."
                  className="w-full bg-[#071311] border border-[#1A3832] rounded-md p-3 text-white text-sm focus:border-[#70F1C7] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#70F1C7] focus:ring-[#70F1C7]"
                />
                <label htmlFor="isActiveToggle" className="text-sm font-medium text-white cursor-pointer">
                  Product Active in Storefront Catalog
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1A3832]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-[#1A3832] text-[#BBD7D1] hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#70F1C7] hover:bg-[#85ffda] text-[#0D221E] font-bold px-6 active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Product'
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
