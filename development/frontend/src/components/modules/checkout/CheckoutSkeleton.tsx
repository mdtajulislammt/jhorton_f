'use client';

import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function CheckoutSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" data-testid="checkout-skeleton">
      {/* Title & subtitle skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28 rounded-md bg-muted/60" />
        <Skeleton className="h-9 w-64 rounded-md bg-muted/60" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md bg-muted/40" />
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Fulfillment Toggle Skeleton */}
          <div className="p-1.5 rounded-2xl border border-border/60 bg-card/40 grid grid-cols-2 gap-2">
            <Skeleton className="h-12 rounded-xl bg-muted/60" />
            <Skeleton className="h-12 rounded-xl bg-muted/40" />
          </div>

          {/* Address/ZIP skeleton */}
          <div className="p-5 rounded-2xl border border-border/60 bg-card/40 space-y-4">
            <Skeleton className="h-5 w-40 rounded bg-muted/60" />
            <Skeleton className="h-11 w-full rounded-xl bg-muted/40" />
            <Skeleton className="h-11 w-full rounded-xl bg-muted/40" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-11 rounded-xl bg-muted/40" />
              <Skeleton className="h-11 rounded-xl bg-muted/40" />
              <Skeleton className="h-11 rounded-xl bg-muted/40" />
            </div>
          </div>

          {/* SubOrder Cards skeleton */}
          <div className="p-5 rounded-2xl border border-border/60 bg-card/40 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-border/40">
              <Skeleton className="h-6 w-48 rounded bg-muted/60" />
              <Skeleton className="h-8 w-24 rounded-lg bg-muted/40" />
            </div>
            <Skeleton className="h-10 w-full rounded-xl bg-muted/30" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-full rounded bg-muted/40" />
              <Skeleton className="h-4 w-3/4 rounded bg-muted/40" />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Contact form skeleton */}
          <div className="p-5 rounded-2xl border border-border/60 bg-card/40 space-y-4">
            <Skeleton className="h-5 w-44 rounded bg-muted/60" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-11 rounded-xl bg-muted/40" />
              <Skeleton className="h-11 rounded-xl bg-muted/40" />
            </div>
            <Skeleton className="h-11 rounded-xl bg-muted/40" />
            <Skeleton className="h-11 rounded-xl bg-muted/40" />
          </div>

          {/* Summary skeleton */}
          <div className="p-5 rounded-2xl border border-border/60 bg-card/40 space-y-4">
            <Skeleton className="h-6 w-32 rounded bg-muted/60" />
            <Skeleton className="h-4 w-full rounded bg-muted/40" />
            <Skeleton className="h-4 w-full rounded bg-muted/40" />
            <Skeleton className="h-12 w-full rounded-xl bg-muted/60" />
          </div>
        </div>
      </div>
    </div>
  );
}

