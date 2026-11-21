import * as React from 'react';
import Link from 'next/link';
import { BrandSummaryDto } from '@/types/api.generated';
import { Store } from 'lucide-react';
import { FallbackImage } from '@/components/ui/fallback-image';
import { LogoImage } from './LogoImage';
import { BRAND_PHOTOS } from '@/lib/brand-photos';
import { cn } from '@/lib/utils';

export interface BrandCardProps {
  brand: BrandSummaryDto & {
    productsCount?: number;
    showsCount?: number;
    /** Partner dispensaries that fulfill this brand (design v3 "Fulfilled by"). */
    partnerNames?: string[];
    /** e.g. "Live tonight" or "Next show 7:30 PM" */
    nextShowLabel?: string | null;
  };
  /** Position in a grid; picks the initials-tile colorway. */
  index?: number;
}

// Initials tile colorways from the strain/brand palette (design v3 .blogo)
const LOGO_TONES = [
  'bg-strain-hybrid text-strain-hybrid-foreground',
  'bg-ink text-strain-sativa',
  'bg-card text-foreground',
];
const BANNERS = [BRAND_PHOTOS.plantsLeaves, BRAND_PHOTOS.preRoll, BRAND_PHOTOS.edibles];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function BrandCard({ brand, index = 0 }: BrandCardProps) {
  const partners = brand.partnerNames?.filter(Boolean) ?? [];

  return (
    <Link
      href={`/brands/${brand.slug}`}
      data-testid={`brand-card-${brand.slug}`}
      className="group flex flex-col overflow-hidden rounded-[18px] border border-border bg-card transition-all duration-200 hover:-translate-y-[3px] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0"
    >
      <div className="relative h-[120px] bg-ink">
        <FallbackImage
          src={brand.bannerUrl}
          fallback={BANNERS[index % BANNERS.length]}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-transparent to-owtlet-ink/35" />
        <span
          className={cn(
            'absolute -bottom-6 left-4 z-[1] grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border-[3px] border-card font-heading text-lg',
            LOGO_TONES[index % LOGO_TONES.length]
          )}
        >
          <LogoImage src={brand.logoUrl} label={initials(brand.name)} />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-4 pb-4 pt-[34px]">
        <h3 className="text-base font-bold text-foreground">{brand.name}</h3>
        {partners.length > 0 ? (
          <p className="text-[13px] text-muted-foreground">Fulfilled by {partners.join(', ')}</p>
        ) : brand.description ? (
          <p className="line-clamp-2 text-[13px] text-muted-foreground">{brand.description}</p>
        ) : null}

        <div className="mt-1.5 flex flex-wrap items-center gap-2 empty:hidden">
          {typeof brand.productsCount === 'number' ? (
            <span className="rounded-full bg-surface-muted px-2.5 py-[3px] text-xs font-semibold text-foreground">
              {brand.productsCount} product{brand.productsCount === 1 ? '' : 's'}
            </span>
          ) : null}
          {brand.nextShowLabel ? (
            <span className="rounded-full bg-surface-muted px-2.5 py-[3px] text-xs font-semibold text-foreground">{brand.nextShowLabel}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function BrandGrid({ brands }: { brands: BrandCardProps['brand'][] }) {
  if (brands.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card/40">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <Store className="h-7 w-7" />
        </div>
        <h3 className="font-heading text-lg font-bold text-foreground">
          No Brand Storefronts Available
        </h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Our craft cultivator network is currently preparing official partner storefront channels.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
      {brands.map((brand, i) => (
        <BrandCard key={brand.id} brand={brand} index={i} />
      ))}
    </div>
  );
}

