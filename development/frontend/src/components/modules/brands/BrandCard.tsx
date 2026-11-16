import * as React from 'react';
import Link from 'next/link';
import { BrandSummaryDto } from '@/server/brands';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Store } from 'lucide-react';

export interface BrandCardProps {
  brand: BrandSummaryDto & {
    productsCount?: number;
    showsCount?: number;
  };
}

export function BrandCard({ brand }: BrandCardProps) {
  return (
    <Card
      interactive
      className="group flex flex-col justify-between overflow-hidden border-border bg-card transition-all duration-200 hover:border-primary/60 hover:shadow-lg"
      data-testid={`brand-card-${brand.slug}`}
    >
      <Link href={`/brands/${brand.slug}`} className="flex flex-col h-full">
        {/* Banner container */}
        <div className="relative h-32 sm:h-36 w-full overflow-hidden bg-owtlet-sage/20">
          {brand.bannerUrl ? (
            <img
              src={brand.bannerUrl}
              alt={`${brand.name} banner`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 via-card to-owtlet-sage/20">
              <Sparkles className="h-10 w-10 text-primary/30" />
            </div>
          )}

          {/* Logo badge overlay */}
          <div className="absolute -bottom-4 left-4 h-14 w-14 rounded-xl border-2 border-background bg-card shadow-md flex items-center justify-center overflow-hidden">
            {brand.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-heading text-lg font-bold text-primary">
                {brand.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <CardContent className="pt-6 pb-5 px-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-heading text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                {brand.name}
              </h3>
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/30">
                Official Channel
              </Badge>
            </div>

            {brand.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {brand.description}
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center text-primary font-semibold group-hover:underline">
              Enter Storefront
              <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

export function BrandGrid({ brands }: { brands: (BrandSummaryDto & { productsCount?: number; showsCount?: number })[] }) {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {brands.map((brand) => (
        <BrandCard key={brand.id} brand={brand} />
      ))}
    </div>
  );
}

