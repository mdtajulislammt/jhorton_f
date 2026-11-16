import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function CartSkeleton() {
  return (
    <div className="space-y-4 py-2" role="status" aria-label="Loading your stash">
      {[1, 2, 3].map((index) => (
        <div key={index} className="flex gap-4 py-3 border-b border-border/40">
          <Skeleton className="h-20 w-20 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
