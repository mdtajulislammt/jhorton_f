'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import {
  useShopperAddresses,
  useCreateShopperAddress,
  useUpdateShopperAddress,
  useDeleteShopperAddress,
} from '@/hooks/useShopperAccount';
import { toast } from '@/stores/toast.store';
import { MapPin, Plus, Trash2, Check, Star, Loader2, Home } from 'lucide-react';
import { ShopperAddressDto } from '@/types/api.generated';

export function AddressList() {
  const { data: addresses = [], isLoading } = useShopperAddresses();
  const createAddressMutation = useCreateShopperAddress();
  const updateAddressMutation = useUpdateShopperAddress();
  const deleteAddressMutation = useDeleteShopperAddress();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingAddress, setEditingAddress] = React.useState<ShopperAddressDto | null>(null);

  const [label, setLabel] = React.useState('');
  const [line1, setLine1] = React.useState('');
  const [line2, setLine2] = React.useState('');
  const [city, setCity] = React.useState('New York');
  const [state, setState] = React.useState('NY');
  const [zip, setZip] = React.useState('');
  const [isDefault, setIsDefault] = React.useState(false);

  const openCreateDialog = () => {
    setEditingAddress(null);
    setLabel('');
    setLine1('');
    setLine2('');
    setCity('New York');
    setState('NY');
    setZip('');
    setIsDefault(addresses.length === 0);
    setIsDialogOpen(true);
  };

  const openEditDialog = (addr: ShopperAddressDto) => {
    setEditingAddress(addr);
    setLabel(addr.label || '');
    setLine1(addr.line1);
    setLine2(addr.line2 || '');
    setCity(addr.city);
    setState(addr.state);
    setZip(addr.zip);
    setIsDefault(addr.isDefault);
    setIsDialogOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!line1.trim() || !city.trim() || !zip.trim()) {
      toast.error('Please fill in street address, city, and 5-digit ZIP code');
      return;
    }

    try {
      if (editingAddress) {
        await updateAddressMutation.mutateAsync({
          id: editingAddress.id,
          data: {
            label: label.trim() || null,
            line1: line1.trim(),
            line2: line2.trim() || null,
            city: city.trim(),
            state: state.trim() || 'NY',
            zip: zip.trim(),
            isDefault,
          },
        });
        toast.success('Address updated successfully');
      } else {
        await createAddressMutation.mutateAsync({
          label: label.trim() || null,
          line1: line1.trim(),
          line2: line2.trim() || null,
          city: city.trim(),
          state: state.trim() || 'NY',
          zip: zip.trim(),
          isDefault,
        });
        toast.success('Address added to your address book');
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save address');
    }
  };

  const handleSetDefault = async (addrId: string) => {
    try {
      await updateAddressMutation.mutateAsync({
        id: addrId,
        data: { isDefault: true },
      });
      toast.success('Default delivery address updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to set default address');
    }
  };

  const handleDelete = async (addrId: string) => {
    try {
      await deleteAddressMutation.mutateAsync(addrId);
      toast.info('Address removed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete address');
    }
  };

  return (
    <Card className="border border-border/80 bg-card shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-heading flex items-center gap-2 text-foreground">
            <Home className="h-5 w-5 text-primary" />
            Saved Delivery Addresses
          </CardTitle>
          <Button
            type="button"
            onClick={openCreateDialog}
            size="sm"
            className="min-h-[38px] font-semibold text-xs active:scale-[0.98]"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Address
          </Button>
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          Manage your verified NY delivery locations. The default address automatically pre-fills during checkout.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-16 bg-muted animate-pulse rounded-lg" />
            <div className="h-16 bg-muted animate-pulse rounded-lg" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border/80 rounded-xl p-6">
            <MapPin className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-semibold text-foreground">No saved addresses yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Add your New York delivery address for instant checkout pre-fill.
            </p>
            <Button
              type="button"
              onClick={openCreateDialog}
              variant="outline"
              size="sm"
              className="min-h-[40px] font-semibold text-xs"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add First Address
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {addresses.map((addr: ShopperAddressDto) => (
              <div
                key={addr.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  addr.isDefault
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/60'
                    : 'border-border/80 bg-card hover:border-border'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-semibold text-sm text-foreground">
                        {addr.label || 'Delivery Address'}
                      </span>
                      {addr.isDefault && (
                        <Badge
                          variant="outline"
                          className="border-transparent text-foreground bg-primary/25 text-[10px] py-0 px-1.5"
                        >
                          Default
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(addr)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(addr.id)}
                        disabled={deleteAddressMutation.isPending}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-foreground mt-2 font-medium">
                    {addr.line1}
                    {addr.line2 && <span className="text-muted-foreground">, {addr.line2}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {addr.city}, {addr.state} {addr.zip}
                  </p>
                </div>

                {!addr.isDefault && (
                  <div className="mt-3 pt-2 border-t border-border/40 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(addr.id)}
                      disabled={updateAddressMutation.isPending}
                      className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
                    >
                      <Star className="mr-1 h-3 w-3" />
                      Make Default
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Address Modal Dialog */}
        <Dialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          title={editingAddress ? 'Edit Delivery Address' : 'Add New Address'}
        >
          <form onSubmit={handleSaveAddress} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                  Address Label (Optional)
                </label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Home, Loft, Office"
                  className="h-10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                  Street Address *
                </label>
                <Input
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="123 Bowery"
                  required
                  className="h-10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                  Apt, Suite, Floor (Optional)
                </label>
                <Input
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  placeholder="Apt 4B"
                  className="h-10"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                    City *
                  </label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="h-10"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                    State
                  </label>
                  <Input value={state} disabled className="h-10 bg-muted/40 cursor-not-allowed" />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                    ZIP Code *
                  </label>
                  <Input
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    placeholder="10001"
                    maxLength={5}
                    required
                    className="h-10"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="defaultAddressCheckbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary"
                />
                <label
                  htmlFor="defaultAddressCheckbox"
                  className="text-xs font-medium text-foreground cursor-pointer select-none"
                >
                  Set as default delivery address
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="min-h-[40px] text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                  className="min-h-[40px] text-xs font-bold px-4"
                >
                  {createAddressMutation.isPending || updateAddressMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Save Address'
                  )}
                </Button>
              </div>
            </form>
        </Dialog>
      </CardContent>
    </Card>
  );
}
