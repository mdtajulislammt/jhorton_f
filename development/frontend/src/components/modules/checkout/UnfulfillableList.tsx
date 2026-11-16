'use client';

import * as React from 'react';
import { AlertCircle, Trash2, ArrowRight, Store, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UnfulfillableLine } from '@/server/distribution/types';

interface UnfulfillableListProps {
  unfulfillable: UnfulfillableLine[];
  onSwitchToStore: (productId: string, dispensaryId: string) => void;
  onRemoveItem: (productId: string) => void;
  isRemoving?: boolean;
}

export function UnfulfillableList({
  unfulfillable,
  onSwitchToStore,
  onRemoveItem,
  isRemoving,
}: UnfulfillableListProps) {
  if (!unfulfillable || unfulfillable.length === 0) return null;

  return (
    <div
      role="alert"
      data-testid="unfulfillable-list"
      className="p-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 text-foreground space-y-4 animate-in fade-in duration-200"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-heading font-semibold text-sm text-foreground">
            {unfulfillable.length} Item{unfulfillable.length > 1 ? 's' : ''} Out of Stock
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Some items are not available at your selected store or delivery ZIP. Place Order is
            disabled until you switch them to an available dispensary or remove them.
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        {unfulfillable.map((line) => {
          return (
            <div
              key={line.productId}
              className="p-4 rounded-xl border border-amber-500/20 bg-background/80 space-y-3"
              data-testid={`unfulfillable-item-${line.productId}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-sm text-foreground">{line.name}</span>
                  <div className="text-xs text-amber-400/90 font-medium mt-0.5">
                    {line.reason === 'NOT_IN_STOCK_FOR_ZIP' && 'Out of stock for this delivery area'}
                    {line.reason === 'NOT_AT_SELECTED_STORE' && 'Out of stock at selected dispensary'}
                    {line.reason === 'NO_ELIGIBLE_STORES' && 'Not in stock at any partner dispensary'}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isRemoving}
                  onClick={() => onRemoveItem(line.productId)}
                  data-testid={`remove-oos-${line.productId}`}
                  className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30 h-8 px-3 rounded-lg shrink-0"
                >
                  <Trash2 className="h-3 w-3 mr-1.5" />
                  Remove Item
                </Button>
              </div>

              {/* Suggestions */}
              {line.suggestions && line.suggestions.length > 0 && (
                <div className="pt-2 border-t border-border/60 space-y-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Available at nearby partner dispensaries:
                  </p>

                  <div className="grid grid-cols-1 gap-2">
                    {line.suggestions.map((sug) => (
                      <div
                        key={sug.dispensaryId}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-card border border-border/80 text-xs gap-2"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <Store className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="font-medium text-foreground">{sug.dispensaryName}</span>
                          <span className="text-muted-foreground text-[11px]">
                            ({sug.fulfillmentTypes.map((t) => t.toLowerCase()).join(' & ')})
                          </span>
                          {sug.distanceMiles !== null && (
                            <span className="text-muted-foreground text-[11px]">
                              · {sug.distanceMiles.toFixed(1)} mi
                            </span>
                          )}
                        </div>

                        <Button
                          type="button"
                          onClick={() => onSwitchToStore(line.productId, sug.dispensaryId)}
                          data-testid={`switch-oos-${line.productId}-${sug.dispensaryId}`}
                          className="bg-primary text-primary-foreground hover:bg-owtlet-volt font-semibold text-[11px] h-7 px-3 rounded-lg shrink-0 active:scale-[0.98]"
                        >
                          <ArrowRight className="h-3 w-3 mr-1" />
                          Switch to this store
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

