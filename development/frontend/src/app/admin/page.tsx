'use client';

import React, { useEffect, useState } from 'react';
import {
  Package,
  Layers,
  Store,
  Tag,
  ShoppingBag,
  Tv,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      try {
        const [prodRes, dispRes, brandRes, ordRes, showRes] = await Promise.all([
          fetch('/api/admin/products').then((r) => r.json()).catch(() => ({})),
          fetch('/api/admin/dispensaries').then((r) => r.json()).catch(() => ({})),
          fetch('/api/admin/brands').then((r) => r.json()).catch(() => ({})),
          fetch('/api/admin/orders').then((r) => r.json()).catch(() => ({})),
          fetch('/api/admin/live-shows').then((r) => r.json()).catch(() => ({})),
        ]);

        const products = prodRes.data?.items || [];
        const dispensaries = dispRes.data?.items || [];
        const brands = brandRes.data?.items || [];
        const orders = ordRes.data?.items || [];
        const shows = showRes.data?.items || [];

        setMetrics({
          productsCount: products.length,
          activeProductsCount: products.filter((p: any) => p.isActive).length,
          dispensariesCount: dispensaries.length,
          activeDispensariesCount: dispensaries.filter((d: any) => d.isActive).length,
          brandsCount: brands.length,
          activeBrandsCount: brands.filter((b: any) => b.isActive).length,
          ordersCount: orders.length,
          pendingOrdersCount: orders.filter((o: any) => o.status === 'PENDING').length,
          confirmedOrdersCount: orders.filter((o: any) => o.status === 'CONFIRMED').length,
          showsCount: shows.length,
          liveShowsCount: shows.filter((s: any) => s.status === 'LIVE').length,
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-[clamp(24px,3vw,34px)] leading-[1.08] tracking-[-0.01em] text-foreground">
            OPERATIONS DASHBOARD
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time management for Owtlet cannabis marketplace & live shopping.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/15 text-success border border-primary/50 px-3 py-1 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            21+ NY Adult-Use Licensed
          </Badge>
        </div>
      </div>

      {/* Metrics Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-4 w-24 bg-surface-muted" />
                <Skeleton className="h-8 w-16 bg-surface-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Card className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-body text-[13px] font-semibold text-muted-foreground">
                Products
              </CardTitle>
              <Package className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="font-mono text-[28px] font-bold tabular-nums text-foreground">
                {metrics?.productsCount || 0}
              </div>
              <p className="text-xs text-muted mt-1">
                {metrics?.activeProductsCount || 0} active in catalog
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-body text-[13px] font-semibold text-muted-foreground">
                Dispensaries
              </CardTitle>
              <Store className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="font-mono text-[28px] font-bold tabular-nums text-foreground">
                {metrics?.dispensariesCount || 0}
              </div>
              <p className="text-xs text-muted mt-1">
                {metrics?.activeDispensariesCount || 0} active partner stores
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-body text-[13px] font-semibold text-muted-foreground">
                Brands
              </CardTitle>
              <Tag className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="font-mono text-[28px] font-bold tabular-nums text-foreground">
                {metrics?.brandsCount || 0}
              </div>
              <p className="text-xs text-muted mt-1">
                {metrics?.activeBrandsCount || 0} active storefront channels
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-body text-[13px] font-semibold text-muted-foreground">
                Marketplace Orders
              </CardTitle>
              <ShoppingBag className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="font-mono text-[28px] font-bold tabular-nums text-foreground">
                {metrics?.ordersCount || 0}
              </div>
              <p className="text-xs text-success mt-1 font-medium">
                {metrics?.confirmedOrdersCount || 0} confirmed · {metrics?.pendingOrdersCount || 0} pending
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-success" />
          Management Modules
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="/admin/products"
            className="group block p-5 rounded-xl bg-card border border-border hover:border-primary transition-all duration-200 active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center text-success">
                <Package className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-success group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-base font-bold text-foreground mt-4 group-hover:text-success transition-colors">
              Products & Live Pricing
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Manage cannabis strains, THC%, categories, and Owtlet uniform show prices.
            </p>
          </a>

          <a
            href="/admin/inventory"
            className="group block p-5 rounded-xl bg-card border border-border hover:border-primary transition-all duration-200 active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center text-success">
                <Layers className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-success group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-base font-bold text-foreground mt-4 group-hover:text-success transition-colors">
              Per-Store Inventory
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Batch update stock quantities and per-store retail prices across partner dispensaries.
            </p>
          </a>

          <a
            href="/admin/dispensaries"
            className="group block p-5 rounded-xl bg-card border border-border hover:border-primary transition-all duration-200 active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center text-success">
                <Store className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-success group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-base font-bold text-foreground mt-4 group-hover:text-success transition-colors">
              Dispensaries & Hours
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Configure pickup/delivery flags, NY delivery coverage ZIPs, and store operating hours.
            </p>
          </a>

          <a
            href="/admin/brands"
            className="group block p-5 rounded-xl bg-card border border-border hover:border-primary transition-all duration-200 active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center text-success">
                <Tag className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-success group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-base font-bold text-foreground mt-4 group-hover:text-success transition-colors">
              Brands & Store Mappings
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Assign partner dispensaries to brands (AC-BRD-01) and manage channel storefronts.
            </p>
          </a>

          <a
            href="/admin/orders"
            className="group block p-5 rounded-xl bg-card border border-border hover:border-primary transition-all duration-200 active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center text-success">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-success group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-base font-bold text-foreground mt-4 group-hover:text-success transition-colors">
              Orders & Status Override
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Review multi-dispensary sub-orders and manually override store confirmation status.
            </p>
          </a>

          <a
            href="/admin/live-shows"
            className="group block p-5 rounded-xl bg-card border border-border hover:border-primary transition-all duration-200 active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center text-success">
                <Tv className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-success group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-base font-bold text-foreground mt-4 group-hover:text-success transition-colors">
              Live Shows & Video Pinning
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Start/end live shows and pin products with enforced Owtlet single pricing (AC-ADM-01).
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}

