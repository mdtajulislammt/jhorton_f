'use client';

import * as React from 'react';
import { Store, CheckCircle2, AlertCircle, Clock, MapPin } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlternativeDispensary } from '@/server/distribution/types';

interface StorePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentStoreName: string;
  alternatives: AlternativeDispensary[];
  onSelectStore: (dispensaryId: string) => void;
}

export function StorePickerDialog({
  isOpen,
  onClose,
  currentStoreName,
  alternatives,
  onSelectStore,
}: StorePickerDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Alternative Dispensary"
      description={`Currently assigned to ${currentStoreName}. Select an eligible licensed partner dispensary below.`}
      className="max-w-xl"
    >
      <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        {alternatives.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm space-y-2">
            <Store className="h-8 w-8 mx-auto text-muted-foreground/60" />
            <p>No other licensed dispensaries currently carry these items for your area.</p>
          </div>
        ) : (
          alternatives.map((alt) => {
            return (
              <div
                key={alt.dispensaryId}
                className="p-4 rounded-xl border border-border bg-card/60 hover:border-primary/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                data-testid={`alt-store-${alt.dispensaryId}`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">
                      {alt.dispensaryName}
                    </span>
                    {alt.canSupplyAll ? (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px] font-medium">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        In Stock (All Items)
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[11px] font-medium">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Missing {alt.missingProductIds.length} item{alt.missingProductIds.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {alt.isOpenNow ? (
                        <span className="text-emerald-400 font-medium">Open Now</span>
                      ) : (
                        <span className="text-muted-foreground">Closed</span>
                      )}
                    </span>

                    {alt.distanceMiles !== null && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{alt.distanceMiles.toFixed(1)} mi away</span>
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    onSelectStore(alt.dispensaryId);
                    onClose();
                  }}
                  data-testid={`select-store-${alt.dispensaryId}`}
                  className="bg-primary text-primary-foreground hover:bg-owtlet-volt font-semibold text-xs px-3.5 py-1.5 h-8 rounded-lg shrink-0 active:scale-[0.98]"
                >
                  Select Store
                </Button>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-6 pt-3 border-t border-border flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="text-xs h-9 px-4 border-border rounded-xl"
        >
          Cancel
        </Button>
      </div>
    </Dialog>
  );
}

