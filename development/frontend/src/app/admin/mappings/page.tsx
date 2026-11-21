'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Link2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  FileText,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  AdminDispensaryDto,
  VendorMappingDto,
  AdminProductDto,
} from '@/types/api.generated';

export default function AdminMappingsPage() {
  const [dispensaries, setDispensaries] = useState<AdminDispensaryDto[]>([]);
  const [selectedDispensaryId, setSelectedDispensaryId] = useState<string>('');
  const [mappings, setMappings] = useState<VendorMappingDto[]>([]);
  const [allProducts, setAllProducts] = useState<AdminProductDto[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [importReport, setImportReport] = useState<any | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load dispensaries and products
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/dispensaries').then((r) => r.json()),
      fetch('/api/admin/products').then((r) => r.json()),
    ])
      .then(([dispRes, prodRes]) => {
        if (dispRes.success && dispRes.data?.items?.length > 0) {
          setDispensaries(dispRes.data.items);
          setSelectedDispensaryId(dispRes.data.items[0].id);
        }
        if (prodRes.success && prodRes.data?.items) {
          setAllProducts(prodRes.data.items);
        }
      })
      .catch(() => {});
  }, []);

  // Load mappings whenever selected dispensary changes
  const loadMappings = async (dispId?: string) => {
    const targetId = dispId || selectedDispensaryId;
    if (!targetId) return;

    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/admin/mappings?dispensaryId=${targetId}`);
      const json = await res.json();
      if (json.success && json.data?.items) {
        setMappings(json.data.items);
      } else {
        setMappings([]);
      }
    } catch {
      setMappings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDispensaryId) {
      loadMappings(selectedDispensaryId);
    }
  }, [selectedDispensaryId]);

  // Compute unmapped SKUs for the selected dispensary
  const mappedSkuSet = new Set(mappings.map((m) => m.ourSku.toUpperCase()));
  const unmappedProducts = allProducts.filter(
    (p) => p.sku && !mappedSkuSet.has(p.sku.toUpperCase()) && p.isActive
  );

  // Filter mappings
  const filteredMappings = mappings.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.ourSku.toLowerCase().includes(q) ||
      (m.vendorSku && m.vendorSku.toLowerCase().includes(q)) ||
      (m.vendorProductId && m.vendorProductId.toLowerCase().includes(q)) ||
      (m.product?.name && m.product.name.toLowerCase().includes(q))
    );
  });

  // Handle CSV file selection
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatusMessage(null);
    setImportReport(null);

    try {
      const text = await file.text();
      const res = await fetch('/api/admin/mappings/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: text }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMessage({
          kind: 'success',
          text: `CSV import complete: ${json.data.created} created, ${json.data.updated} updated.`,
        });
        setImportReport(json.data);
        loadMappings();
      } else {
        setStatusMessage({
          kind: 'error',
          text: json.error?.message || json.message || 'CSV import failed with errors.',
        });
        if (json.data) {
          setImportReport(json.data);
        }
      }
    } catch (err: any) {
      setStatusMessage({
        kind: 'error',
        text: err.message || 'Failed to process CSV file.',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const selectedDispensary = dispensaries.find((d) => d.id === selectedDispensaryId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Link2 className="h-6 w-6 text-primary" />
            Vendor Product Mappings
          </h1>
          <p className="text-sm text-muted-foreground">
            Map catalog SKUs to dispensary POS/ecommerce identifiers (Shopify, WooCommerce, BigCommerce).
          </p>
        </div>

        {/* CSV Import Controls */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload CSV Mappings
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadMappings()}
            disabled={isLoading}
            className="h-9 w-9 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`flex items-start gap-3 p-4 rounded-lg border text-sm ${
            statusMessage.kind === 'success'
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-destructive/10 border-destructive/30 text-destructive'
          }`}
        >
          {statusMessage.kind === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-semibold">{statusMessage.text}</p>
            {importReport?.errors && importReport.errors.length > 0 && (
              <ul className="mt-2 space-y-1 list-disc list-inside text-xs opacity-90">
                {importReport.errors.slice(0, 5).map((e: any, idx: number) => (
                  <li key={idx}>
                    Row {e.row}: {e.error}
                  </li>
                ))}
                {importReport.errors.length > 5 && (
                  <li>...and {importReport.errors.length - 5} more errors.</li>
                )}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Dispensary Selector Tabs & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Select Retail Partner</CardTitle>
              {selectedDispensary && (
                <Badge variant="outline" className="font-mono text-xs">
                  Platform: {selectedDispensary.platform || 'OTHER'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {dispensaries.map((disp) => {
                const isSelected = disp.id === selectedDispensaryId;
                return (
                  <button
                    key={disp.id}
                    onClick={() => setSelectedDispensaryId(disp.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {disp.name}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Unmapped Count Summary Widget */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Mapping Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">{mappings.length}</span>
              <span className="text-xs text-muted-foreground">Mapped SKUs</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t text-xs">
              <AlertTriangle className={`h-4 w-4 ${unmappedProducts.length > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
              <span className={unmappedProducts.length > 0 ? 'text-warning font-medium' : 'text-muted-foreground'}>
                {unmappedProducts.length} Unmapped Catalog SKUs
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unmapped SKUs Warning Rail (Shows active catalog items needing mapping) */}
      {unmappedProducts.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              Unmapped Active SKUs for {selectedDispensary?.name || 'Selected Store'} ({unmappedProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <p className="text-xs text-muted-foreground mb-3">
              The following active products do not yet have vendor IDs assigned for this store. You can import them via CSV:
            </p>
            <div className="flex flex-wrap gap-2">
              {unmappedProducts.slice(0, 10).map((prod) => (
                <Badge key={prod.id} variant="secondary" className="text-xs font-mono">
                  {prod.sku} <span className="opacity-60 ml-1">({prod.name})</span>
                </Badge>
              ))}
              {unmappedProducts.length > 10 && (
                <Badge variant="outline" className="text-xs">
                  +{unmappedProducts.length - 10} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search & Mappings Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by SKU, Product ID, Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Showing {filteredMappings.length} of {mappings.length} mappings
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : filteredMappings.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No mappings configured"
              description={`No vendor product mappings found for ${selectedDispensary?.name || 'this store'}. Upload a CSV file with columns: our_sku, dispensary_slug, vendor_product_id, vendor_variant_id, vendor_sku, is_available.`}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Our SKU</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Vendor Product ID</th>
                    <th className="py-2.5 px-3">Vendor Variant ID</th>
                    <th className="py-2.5 px-3">Vendor SKU</th>
                    <th className="py-2.5 px-3 text-center">Available</th>
                    <th className="py-2.5 px-3 text-right">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredMappings.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                        {m.ourSku}
                      </td>
                      <td className="py-2.5 px-3 text-foreground font-medium max-w-[200px] truncate">
                        {m.product?.name || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">
                        {m.vendorProductId || <span className="opacity-40">—</span>}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">
                        {m.vendorVariantId || <span className="opacity-40">—</span>}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">
                        {m.vendorSku || <span className="opacity-40">—</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge
                          variant={m.isAvailable ? 'default' : 'secondary'}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {m.isAvailable ? 'YES' : 'NO'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground text-[11px]">
                        {new Date(m.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

