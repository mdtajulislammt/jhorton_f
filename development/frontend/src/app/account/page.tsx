'use client';

import * as React from 'react';
import { useShopperProfile, useLogout } from '@/hooks/useShopperAccount';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfileForm } from '@/components/modules/account/ProfileForm';
import { DefaultStorePicker } from '@/components/modules/account/DefaultStorePicker';
import { AddressList } from '@/components/modules/account/AddressList';
import { OrderHistory } from '@/components/modules/account/OrderHistory';
import { LogOut, UserCheck, ShieldCheck } from 'lucide-react';

export default function AccountPage() {
  const { data: profile, isLoading } = useShopperProfile();
  const logoutMutation = useLogout();

  const [activeTab, setActiveTab] = React.useState<'profile' | 'addresses' | 'orders'>(
    'profile'
  );

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Shopper Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-card via-card to-primary/5 border border-border/80 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <UserCheck className="h-7 w-7" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">
                  {profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}` : 'Shopper Profile'}
                </h1>
                <Badge variant="outline" className="text-xs border-primary/40 text-primary bg-primary/10">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  21+ Verified
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {profile?.email || 'Loading account...'}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="self-start sm:self-center min-h-[40px] text-xs font-semibold text-muted-foreground hover:text-danger hover:border-danger/40 active:scale-[0.98]"
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Log Out
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-4 font-heading font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Profile & Default Store
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`pb-3 px-4 font-heading font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'addresses'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Saved Addresses
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-4 font-heading font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Order History
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <ProfileForm />
            <DefaultStorePicker />
          </div>
        )}

        {activeTab === 'addresses' && (
          <div>
            <AddressList />
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <OrderHistory />
          </div>
        )}
      </div>
    </div>
  );
}

