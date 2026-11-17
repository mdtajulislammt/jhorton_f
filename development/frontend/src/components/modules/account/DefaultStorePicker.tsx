'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useShopperProfile, useUpdateShopperProfile } from '@/hooks/useShopperAccount';
import { toast } from '@/stores/toast.store';
import { Store, Check, MapPin, Truck, ShoppingBag, Loader2 } from 'lucide-react';
import { DispensaryListItemDto } from '@/types/api.generated';

export function DefaultStorePicker() {
  const { data: profile } = useShopperProfile();
  const updateProfileMutation = useUpdateShopperProfile();

  const [dispensaries, setDispensaries] = React.useState<DispensaryListItemDto[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (profile?.defaultDispensaryId) {
      setSelectedId(profile.defaultDispensaryId);
    }
  }, [profile]);

  React.useEffect(() => {
    async function loadDispensaries() {
      try {
        const res = await fetch('/api/dispensaries?fulfillment=PICKUP');
        const json = await res.json();
        if (json.success && json.data?.items) {
          setDispensaries(json.data.items);
        }
      } catch (err) {
        console.error('Failed to load dispensaries:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDispensaries();
  }, []);

  const handleSelectStore = async (storeId: string) => {
    const newStoreId = storeId === selectedId ? null : storeId;
    setSelectedId(newStoreId);
    try {
      await updateProfileMutation.mutateAsync({
        defaultDispensaryId: newStoreId,
      });
      if (newStoreId) {
        toast.success('Default partner store updated');
      } else {
        toast.info('Default partner store cleared');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update default store');
      setSelectedId(profile?.defaultDispensaryId || null);
    }
  };

  return (
    <Card className="border border-border/80 bg-card shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-heading flex items-center gap-2 text-foreground">
            <Store className="h-5 w-5 text-primary" />
            Default Partner Store
          </CardTitle>
          {profile?.defaultDispensary && (
            <Badge variant="outline" className="border-transparent text-foreground bg-primary/25">
              <Check className="mr-1 h-3 w-3" />
              Active Preference
            </Badge>
          )}
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          Your default partner dispensary receives your cannabis cart items first whenever in stock.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-20 bg-muted animate-pulse rounded-lg" />
            <div className="h-20 bg-muted animate-pulse rounded-lg" />
          </div>
        ) : dispensaries.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No active partner dispensaries currently available.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dispensaries.map((store) => {
              const isSelected = selectedId === store.id;
              return (
                <div
                  key={store.id}
                  onClick={() => handleSelectStore(store.id)}
                  className={`relative p-4 rounded-xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border/80 bg-card/60 hover:border-primary/40 hover:bg-muted/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-heading font-semibold text-foreground text-sm flex items-center gap-1.5">
                        {store.name}
                        {isSelected && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {store.distanceMiles !== null ? `${store.distanceMiles.toFixed(1)} miles away` : 'Licensed NY Dispensary'}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className="min-h-[36px] text-xs font-semibold px-2.5 shrink-0"
                    >
                      {updateProfileMutation.isPending && selectedId === store.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : isSelected ? (
                        'Preferred'
                      ) : (
                        'Set Default'
                      )}
                    </Button>
                  </div>

                  <div className="mt-3 flex items-center gap-2 pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                    {store.offersPickup && (
                      <span className="inline-flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3 text-primary" /> Pickup
                      </span>
                    )}
                    {store.offersDelivery && (
                      <span className="inline-flex items-center gap-1">
                        <Truck className="h-3 w-3 text-accent" /> Delivery
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
