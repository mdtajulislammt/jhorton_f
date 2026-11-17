'use client';

import React, { useEffect, useState } from 'react';
import {
  Layers,
  Save,
  Search,
  Store,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { AdminInventoryItemDto, AdminDispensaryDto } from '@/types/api.generated';

export default function AdminInventoryPage() {
  const [dispensaries, setDispensaries] = useState<AdminDispensaryDto[]>([]);
  const [selectedDispensaryId, setSelectedDispensaryId] = useState<string>('');
  const [inventoryItems, setInventoryItems] = useState<AdminInventoryItemDto[]>([]);
  const [editedItems, setEditedItems] = useState<Record<string, { stockQty: number; price?: number | null }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  // Load dispensaries
  useEffect(() => {
    fetch('/api/admin/dispensaries')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.items?.length > 0) {
          setDispensaries(data.data.items);
          setSelectedDispensaryId(data.data.items[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Load inventory for selected dispensary
  const loadInventory = async (dispensaryId?: string) => {
    const dId = dispensaryId || selectedDispensaryId;
    if (!dId) return;

    setIsLoading(true);
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/inventory?dispensaryId=${dId}`);
      const json = await res.json();
      if (json.success) {
        setInventoryItems(json.data.items);
        setEditedItems({});
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDispensaryId) {
      loadInventory(selectedDispensaryId);
    }
  }, [selectedDispensaryId]);

  const handleStockChange = (item: AdminInventoryItemDto, newStock: number) => {
    const key = `${item.productId}_${item.dispensaryId}`;
    setEditedItems((prev) => ({
      ...prev,
      [key]: {
        stockQty: Math.max(0, newStock),
        price: prev[key]?.price !== undefined ? prev[key]?.price : item.price,
      },
    }));
  };

  const handlePriceChange = (item: AdminInventoryItemDto, newPrice: string) => {
    const key = `${item.productId}_${item.dispensaryId}`;
    const parsedPrice = newPrice === '' ? null : Number(newPrice);
    setEditedItems((prev) => ({
      ...prev,
      [key]: {
        stockQty: prev[key]?.stockQty !== undefined ? prev[key]?.stockQty : item.stockQty,
        price: parsedPrice,
      },
    }));
  };

  const handleSaveInventory = async () => {
    const editedKeys = Object.keys(editedItems);
    if (editedKeys.length === 0) return;

    setIsSaving(true);
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);

    const itemsToUpdate = editedKeys.map((key) => {
      const [productId, dispensaryId] = key.split('_');
      return {
        productId,
        dispensaryId,
        stockQty: editedItems[key].stockQty,
        price: editedItems[key].price,
      };
    });

    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToUpdate }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setSaveErrorMessage(json.error?.message || 'Failed to update inventory');
        setIsSaving(false);
        return;
      }

      setSaveSuccessMessage(`Successfully updated ${json.data.updatedCount} inventory item(s).`);
      setEditedItems({});
      await loadInventory();
    } catch {
      setSaveErrorMessage('Network error while saving inventory.');
    } finally {
      setIsSaving(false);
    }
  };

  const editedCount = Object.keys(editedItems).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-[clamp(24px,3vw,34px)] leading-[1.08] tracking-[-0.01em] text-foreground">
            PER-STORE INVENTORY
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage real-time stock levels and per-store retail prices across licensed dispensaries.
          </p>
        </div>

        <Button
          onClick={handleSaveInventory}
          disabled={editedCount === 0 || isSaving}
          className="bg-primary hover:bg-primary-hover text-primary-foreground font-bold h-11 px-5 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Inventory ({editedCount})
            </>
          )}
        </Button>
      </div>

      {/* Dispensary Selector */}
      <div className="flex items-center gap-3 bg-card border border-border p-4 rounded-xl">
        <Store className="w-5 h-5 text-success shrink-0" />
        <div className="flex-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Select Partner Dispensary
          </label>
          <select
            value={selectedDispensaryId}
            onChange={(e) => setSelectedDispensaryId(e.target.value)}
            className="w-full bg-background border border-border text-foreground rounded-md px-3 h-10 text-sm focus:border-primary focus:outline-none"
          >
            {dispensaries.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} — {d.city}, {d.state} ({d.zip})
              </option>
            ))}
          </select>
        </div>
        <Button
          variant="outline"
          onClick={() => loadInventory()}
          className="border-border text-muted-foreground hover:text-success hover:border-primary h-10 mt-5"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Status Messages */}
      {saveSuccessMessage && (
        <div
          role="status"
          className="p-3.5 rounded-lg bg-success/10 border border-success/30 text-success text-sm flex items-center gap-2.5"
        >
          <CheckCircle2 className="w-5 h-5 text-success" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {saveErrorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm flex items-center gap-2.5"
        >
          <AlertCircle className="w-5 h-5 text-danger" />
          <span>{saveErrorMessage}</span>
        </div>
      )}

      {/* Pricing Rule Note */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border text-xs text-muted-foreground">
        <Info className="w-4 h-4 text-success shrink-0" />
        <span>
          <strong>Pricing Invariant:</strong> If a product has a uniform <strong>Owtlet Price</strong> set, that price overrides the store price across all partner dispensaries during live shows. Per-store prices apply when no Owtlet price is configured.
        </span>
      </div>

      {/* Inventory Table */}
      <Card className="bg-card border-border overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48 bg-surface-muted" />
                  <Skeleton className="h-4 w-28 bg-surface-muted" />
                </div>
                <div className="flex gap-4">
                  <Skeleton className="h-9 w-20 bg-surface-muted" />
                  <Skeleton className="h-9 w-24 bg-surface-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : inventoryItems.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="No Inventory Records"
              description="No inventory records found for this dispensary. Select another store or add catalog products."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background border-b border-border text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Brand / Category</th>
                  <th className="py-3 px-4">Stock Quantity</th>
                  <th className="py-3 px-4">Store Retail Price</th>
                  <th className="py-3 px-4">Effective Shopper Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inventoryItems.map((item) => {
                  const key = `${item.productId}_${item.dispensaryId}`;
                  const isModified = Boolean(editedItems[key]);
                  const currentStock =
                    editedItems[key]?.stockQty !== undefined
                      ? editedItems[key].stockQty
                      : item.stockQty;
                  const currentPrice =
                    editedItems[key]?.price !== undefined
                      ? editedItems[key].price
                      : item.price;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-surface-muted transition-colors ${
                        isModified ? 'bg-primary/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-semibold text-foreground">
                        <div>{item.productName}</div>
                        <div className="text-xs text-muted font-mono">
                          {item.productSku || 'SKU-N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <div>{item.brandName || 'Independent'}</div>
                        <div className="text-xs text-muted">{item.categoryName || 'Cannabis'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          min="0"
                          value={currentStock}
                          onChange={(e) => handleStockChange(item, parseInt(e.target.value) || 0)}
                          className="w-24 bg-background border-border text-foreground h-9 font-mono"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted text-xs">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={currentPrice !== null && currentPrice !== undefined ? currentPrice : ''}
                            onChange={(e) => handlePriceChange(item, e.target.value)}
                            placeholder="0.00"
                            className="pl-6 bg-background border-border text-foreground h-9 font-mono"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {item.owtletPrice !== null ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-success">
                              ${item.owtletPrice.toFixed(2)}
                            </span>
                            <Badge className="bg-primary/15 text-success border border-primary/50 text-[10px] px-1.5 py-0">
                              Owtlet Live Price
                            </Badge>
                          </div>
                        ) : currentPrice !== null && currentPrice !== undefined ? (
                          <span className="font-bold text-foreground font-mono">
                            ${Number(currentPrice).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted italic">Unpriced</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

