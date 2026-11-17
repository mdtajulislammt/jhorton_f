import * as React from 'react';
import Link from 'next/link';
import { BrandSummaryDto, BrandDispensarySummaryDto } from '@/server/brands';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, MapPin, Store, ShieldCheck, ArrowLeft } from 'lucide-react';

export interface BrandHeroProps {
  brand: BrandSummaryDto;
  dispensaries: BrandDispensarySummaryDto[];
  productCount: number;
}

export function BrandHero({ brand, dispensaries, productCount }: BrandHeroProps) {
  return (
    <section className="relative w-full border-b border-border bg-card/60">
      {/* Banner Backdrop */}
      <div className="relative h-44 sm:h-56 md:h-64 w-full overflow-hidden bg-owtlet-sage/30">
        {brand.bannerUrl ? (
          <img
            src={brand.bannerUrl}
            alt={`${brand.name} banner`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-primary/15 via-background/40 to-accent/15">
            <Sparkles className="h-16 w-16 text-primary/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      {/* Brand Identity & Details Container */}
      <div className="mx-auto max-w-content px-4 sm:px-7 -mt-16 sm:-mt-20 pb-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            {/* Logo */}
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-4 border-background bg-card shadow-xl flex items-center justify-center overflow-hidden flex-shrink-0">
              {brand.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-heading text-3xl font-bold text-primary">
                  {brand.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            {/* Title & Badges */}
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <Badge variant="outline" className="text-xs uppercase font-bold text-primary border-primary/40 bg-primary/10">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  Official Brand Channel
                </Badge>
                <Badge variant="secondary" className="text-xs font-semibold">
                  {productCount} {productCount === 1 ? 'Product' : 'Products'}
                </Badge>
              </div>

              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                {brand.name}
              </h1>

              {brand.description && (
                <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
                  {brand.description}
                </p>
              )}
            </div>
          </div>

          {/* Partner Dispensary Count Badge / Back to all */}
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/brands">
              <Button variant="outline" size="sm" className="min-h-[44px] font-semibold">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                All Brands
              </Button>
            </Link>
          </div>
        </div>

        {/* Partner Dispensaries Strip (Fulfilled by) */}
        {dispensaries.length > 0 && (
          <div className="mt-6 pt-5 border-t border-border/60">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center mr-1">
                <Store className="mr-1.5 h-3.5 w-3.5 text-primary" />
                Fulfilled by {dispensaries.length} Partner Store{dispensaries.length > 1 ? 's' : ''}:
              </span>
              {dispensaries.map((disp) => (
                <Badge
                  key={disp.id}
                  variant="secondary"
                  className="text-xs py-1 px-2.5 font-medium border border-border/80"
                >
                  <MapPin className="mr-1 h-3 w-3 text-primary" />
                  {disp.name} ({disp.city}, NY {disp.zip})
                  {disp.offersPickup && disp.offersDelivery
                    ? ' · Pickup & Delivery'
                    : disp.offersDelivery
                    ? ' · Delivery Only'
                    : ' · Pickup Only'}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

