'use client';

import * as React from 'react';
import {
  Store,
  MapPin,
  Clock,
  Truck,
  CheckCircle2,
  Navigation,
  Loader2,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CartVendorDto } from '@/types/api.generated';

interface VendorSelectorProps {
  vendors: CartVendorDto[];
  selectedDispensaryId: string | null;
  onSelectVendor: (dispensaryId: string) => void;
  isSelecting: boolean;
  onUseLocation: () => void;
  isLocating: boolean;
  zipInput: string;
  onZipChange: (zip: string) => void;
  onApplyZip: () => void;
}

export function VendorSelector({
  vendors,
  selectedDispensaryId,
  onSelectVendor,
  isSelecting,
  onUseLocation,
  isLocating,
  zipInput,
  onZipChange,
  onApplyZip,
}: VendorSelectorProps) {
  const selectedVendor = vendors.find((v) => v.dispensaryId === selectedDispensaryId);

  return (
    <div className="p-5 rounded-2xl border border-border bg-card text-foreground shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h3 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <span>Fulfillment Partner Dispensary</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            One licensed partner dispensary prepares and fulfills your entire order.
          </p>
        </div>

        {/* Location & ZIP Actions */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onUseLocation}
            disabled={isLocating}
            className="h-8 text-xs font-medium rounded-lg border-border hover:bg-muted/50"
            data-testid="use-my-location-btn"
          >
            {isLocating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Navigation className="h-3.5 w-3.5 mr-1.5 text-primary" />
            )}
            Use my location
          </Button>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onApplyZip();
            }}
            className="flex items-center gap-1"
          >
            <Input
              type="text"
              placeholder="ZIP code"
              value={zipInput}
              onChange={(e) => onZipChange(e.target.value)}
              maxLength={5}
              className="h-8 w-20 text-xs text-center font-mono rounded-lg"
              data-testid="vendor-zip-input"
            />
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              className="h-8 px-2.5 text-xs rounded-lg"
            >
              <Search className="h-3 w-3" />
            </Button>
          </form>
        </div>
      </div>

      {/* Vendor Dropdown / Selection */}
      <div className="space-y-2">
        <label htmlFor="vendor-select" className="text-xs font-semibold text-muted-foreground">
          Select Partner Dispensary
        </label>
        <div className="relative">
          <select
            id="vendor-select"
            value={selectedDispensaryId || ''}
            onChange={(e) => onSelectVendor(e.target.value)}
            disabled={isSelecting || vendors.length === 0}
            data-testid="vendor-dropdown"
            className="w-full h-11 px-3.5 pr-8 rounded-xl border border-border bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
          >
            {vendors.length === 0 ? (
              <option value="">No dispensaries found</option>
            ) : (
              vendors.map((v) => {
                const distText = v.distanceMiles != null ? ` • ${v.distanceMiles} mi` : '';
                const openText = v.isOpenNow ? ' • Open now' : ' • Closed';
                const mappedText = ` • ${v.mappedItemCount}/${v.totalCartItemCount} available`;
                return (
                  <option key={v.dispensaryId} value={v.dispensaryId}>
                    {v.name} ({v.city}){distText}
                    {openText}
                    {mappedText}
                  </option>
                );
              })
            )}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
            <Store className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Selected Vendor Highlight Card */}
      {selectedVendor && (
        <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-semibold text-sm text-foreground">
                  {selectedVendor.name}
                </span>
                {selectedVendor.isOpenNow ? (
                  <Badge className="bg-success/15 text-success border-transparent text-[10px] font-medium">
                    Open Now
                  </Badge>
                ) : (
                  <Badge className="bg-muted text-muted-foreground border-transparent text-[10px] font-medium">
                    Closed
                  </Badge>
                )}
                {selectedVendor.offersDelivery && (
                  <Badge className="bg-primary/10 text-primary border-transparent text-[10px] font-medium flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    Delivery
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {selectedVendor.address}, {selectedVendor.city}, NY {selectedVendor.zip}
                {selectedVendor.distanceMiles != null && (
                  <span className="font-mono text-foreground font-medium">
                    ({selectedVendor.distanceMiles} miles)
                  </span>
                )}
              </p>
            </div>
            {selectedVendor.isPreselected && (
              <span className="text-[10px] text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                Nearest Partner
              </span>
            )}
          </div>

          <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>
                Store Hours Today:{' '}
                <strong className="text-foreground">
                  {selectedVendor.hoursToday
                    ? `${selectedVendor.hoursToday.opensAt} – ${selectedVendor.hoursToday.closesAt}`
                    : 'Closed today'}
                </strong>
              </span>
            </div>

            {selectedVendor.offersDelivery && (
              <div className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  Delivery Hours:{' '}
                  <strong className="text-foreground">
                    {selectedVendor.deliveryHoursToday
                      ? `${selectedVendor.deliveryHoursToday.opensAt} – ${selectedVendor.deliveryHoursToday.closesAt}`
                      : 'Unavailable today'}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

