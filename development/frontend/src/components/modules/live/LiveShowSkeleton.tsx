import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function ShowCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
      <Skeleton className="aspect-video w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
    </div>
  );
}

export function ShowRailSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3.5 w-64" />
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <ShowCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

