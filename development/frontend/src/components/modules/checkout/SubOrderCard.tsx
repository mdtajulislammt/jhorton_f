'use client';

import * as React from 'react';
import {
  Store,
  Clock,
  MapPin,
  Truck,
  RotateCcw,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AllocatedSubOrder } from '@/server/distribution/types';
import { StorePickerDialog } from './StorePickerDialog';

interface SubOrderCardProps {
  subOrder: AllocatedSubOrder;
  onChangeStore: (dispensaryId: string) => void;
}

export function SubOrderCard({ subOrder, onChangeStore }: SubOrderCardProps) {
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);

  // Assignment badge mapping
  const renderAssignmentBadge = () => {
    if (subOrder.channelBrandId) {
      return (
        <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-[11px] font-semibold">
          Brand partner store
        </Badge>
      );
    }

    switch (subOrder.assignment) {
      case 'SHOPPER_CHANGED':
        return (
          <Badge className="bg-primary/15 text-primary border-primary/30 text-[11px] font-semibold">
            You chose this store
          </Badge>
        );
      case 'PROFILE_DEFAULT':
        return (
          <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[11px] font-semibold">
            Your default store
          </Badge>
        );
      case 'AUTO':
      default:
        return (
          <Badge variant="outline" className="border-border text-muted-foreground text-[11px] font-normal">
            Auto-selected
          </Badge>
        );
    }
  };

  // Hours formatting (AC-HRS-01, AC-DLH-01)
  const isDelivery = subOrder.fulfillmentType === 'DELIVERY';
  const isActiveNow = isDelivery ? subOrder.isDeliveringNow : subOrder.isOpenNow;
  const hoursWindow = isDelivery ? subOrder.deliveryHoursToday : subOrder.hoursToday;

  return (
    <div
      className="p-5 rounded-2xl border border-border bg-card text-foreground shadow-sm space-y-4"
      data-testid={`sub-order-card-${subOrder.dispensaryId}`}
    >
      {/* Header: Store Name & Assignment */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading text-base font-semibold text-foreground flex items-center gap-1.5">
              <Store className="h-4 w-4 text-primary shrink-0" />
              <span>{subOrder.dispensaryName}</span>
            </h3>
            {renderAssignmentBadge()}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              {isDelivery ? <Truck className="h-3 w-3 text-accent" /> : <Store className="h-3 w-3 text-accent" />}
              <span className="capitalize">{subOrder.fulfillmentType.toLowerCase()} order</span>
            </span>

            {subOrder.distanceMiles !== null && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{subOrder.distanceMiles.toFixed(1)} mi away</span>
              </span>
            )}
          </div>
        </div>

        {/* Change Store Button */}
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsPickerOpen(true)}
            data-testid={`change-store-btn-${subOrder.dispensaryId}`}
            className="text-xs h-8 px-3 border-border hover:border-primary/50 text-foreground font-medium rounded-xl active:scale-[0.98]"
          >
            <RotateCcw className="h-3 w-3 mr-1.5" />
            Change Store
          </Button>
        </div>
      </div>

      {/* Operating Hours & Dispatch Badge (AC-HRS-01, AC-DLH-01) */}
      <div className="p-3 rounded-xl bg-background/60 border border-border/80 flex items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <div>
            <span className="text-muted-foreground">
              {isDelivery ? 'Delivery Hours:' : 'Store Hours:'}{' '}
            </span>
            <span className="text-foreground font-medium">
              {hoursWindow
                ? `${hoursWindow.opensAt} – ${hoursWindow.closesAt} (NY Time)`
                : 'Closed Today'}
            </span>
          </div>
        </div>

        <div>
          {isActiveNow ? (
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px] font-semibold">
              {isDelivery ? 'Delivering Now' : 'Open for Pickup'}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground border-border text-[11px]">
              {isDelivery ? 'Delivery Closed' : 'Store Closed'}
            </Badge>
          )}
        </div>
      </div>

      {/* Item List */}
      <div className="space-y-2.5 pt-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Items fulfilled by this dispensary ({subOrder.items.length})
        </p>

        <div className="divide-y divide-border/60">
          {subOrder.items.map((item) => (
            <div
              key={item.productId}
              className="py-2.5 flex items-center justify-between text-xs gap-3"
              data-testid={`sub-order-item-${item.productId}`}
            >
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">{item.name}</span>
                  {item.priceMode === 'OWTLET' && (
                    <span className="inline-flex items-center text-[10px] text-accent font-medium">
                      <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                      Live Show Price
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground text-[11px]">
                  Qty: {item.quantity} × ${parseFloat(item.unitPrice).toFixed(2)}
                </div>
              </div>

              <div className="font-semibold text-foreground text-sm font-mono">
                ${parseFloat(item.lineTotal).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subtotal */}
      <div className="pt-3 border-t border-border flex items-center justify-between text-sm">
        <span className="text-muted-foreground font-medium">Dispensary Subtotal</span>
        <span className="font-heading font-semibold text-base text-foreground font-mono">
          ${parseFloat(subOrder.subtotal).toFixed(2)}
        </span>
      </div>

      {/* Store Picker Modal */}
      <StorePickerDialog
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        currentStoreName={subOrder.dispensaryName}
        alternatives={subOrder.alternatives}
        onSelectStore={(dispensaryId) => {
          onChangeStore(dispensaryId);
        }}
      />
    </div>
  );
}

