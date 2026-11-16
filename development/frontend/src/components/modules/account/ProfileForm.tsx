'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useShopperProfile, useUpdateShopperProfile } from '@/hooks/useShopperAccount';
import { toast } from '@/stores/toast.store';
import { User, Phone, MapPin, Mail, Loader2, Check } from 'lucide-react';

export function ProfileForm() {
  const { data: profile, isLoading } = useShopperProfile();
  const updateProfileMutation = useUpdateShopperProfile();

  const [firstName, setFirstName] = React.useState(profile?.firstName || '');
  const [lastName, setLastName] = React.useState(profile?.lastName || '');
  const [phone, setPhone] = React.useState(profile?.phone || '');
  const [homeZip, setHomeZip] = React.useState(profile?.homeZip || '');
  const [isSaved, setIsSaved] = React.useState(false);

  React.useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setPhone(profile.phone || '');
      setHomeZip(profile.homeZip || '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfileMutation.mutateAsync({
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        phone: phone.trim() || null,
        homeZip: homeZip.trim() || null,
      });
      setIsSaved(true);
      toast.success('Shopper profile updated successfully');
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-border/80 bg-card">
        <CardHeader>
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-72 bg-muted animate-pulse rounded mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 bg-muted animate-pulse rounded" />
          <div className="h-10 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/80 bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-heading flex items-center gap-2 text-foreground">
          <User className="h-5 w-5 text-primary" />
          Shopper Details
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Your profile pre-fills your contact details and shipping preferences at checkout.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Read-only email */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Account Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={profile?.email || ''}
                disabled
                className="pl-9 bg-muted/40 cursor-not-allowed text-muted-foreground"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Account identifier. Email cannot be changed directly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1"
              >
                First Name
              </label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                className="h-11"
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1"
              >
                Last Name
              </label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1"
              >
                Mobile Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="212-555-0199"
                  className="pl-9 h-11"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="homeZip"
                className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1"
              >
                Home ZIP Code
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="homeZip"
                  value={homeZip}
                  onChange={(e) => setHomeZip(e.target.value)}
                  placeholder="10001"
                  maxLength={5}
                  className="pl-9 h-11"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="min-h-[44px] px-6 font-bold active:scale-[0.98] transition-transform"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isSaved ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-owtlet-ink" />
                  Saved!
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
