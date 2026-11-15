import * as React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProductBySlug } from '@/server/products';
import { StoreHeader } from '@/components/layout/store-header';
import { StoreFooter } from '@/components/layout/store-footer';
import { StoreAvailabilityList } from '@/components/catalog/store-availability-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Zap,
  ShoppingBag,
  ShieldCheck,
  ChevronRight,
  Scale,
  Award,
  Info,
} from 'lucide-react';

export interface ProductPageProps {
  params: {
    slug: string;
  };
  searchParams?: {
    zip?: string;
  };
}

export async function generateMetadata({ params, searchParams }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug, { zip: searchParams?.zip });

  if (!product) {
    return {
      title: 'Product Not Found — Owtlet™',
    };
  }

  return {
    title: `${product.name} — Owtlet™ Live Shopping`,
    description: product.description || `Buy lab-tested ${product.name} from licensed NY dispensaries on Owtlet.`,
  };
}

export default async function ProductDetailPage({ params, searchParams }: ProductPageProps) {
  const product = await getProductBySlug(params.slug, { zip: searchParams?.zip });

  if (!product) {
    notFound();
  }

  const isOwtletPrice = product.priceMode === 'OWTLET' && product.owtletPrice;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StoreHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-10">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Link href="/shop" className="hover:text-primary transition-colors">
              Shop
            </Link>
            <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
            <Link
              href={`/shop/${product.category.slug}`}
              className="hover:text-primary transition-colors uppercase tracking-wider"
            >
              {product.category.name}
            </Link>
            <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
            <span className="text-foreground truncate max-w-xs">{product.name}</span>
          </nav>

          {/* Product Overview Section */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start">
            {/* Left: Media Presentation (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {product.imageUrls && product.imageUrls.length > 0 ? (
                  <img
                    src={product.imageUrls[0]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-owtlet-sage/20 text-muted-foreground">
                    <Sparkles className="h-16 w-16 text-primary/50 mb-3" />
                    <span className="font-heading text-lg text-foreground">{product.name}</span>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                      {product.category.name}
                    </span>
                  </div>
                )}

                {/* Live Show / One Price Badge */}
                {isOwtletPrice && (
                  <div className="absolute top-4 left-4">
                    <Badge variant="live" className="shadow-lg py-1 px-3 text-xs">
                      <Zap className="mr-1.5 h-3.5 w-3.5 fill-white" />
                      One Owtlet Show Price
                    </Badge>
                  </div>
                )}

                {/* Strain Badge */}
                {product.strain && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="default" className="shadow-md text-xs font-bold uppercase tracking-wider">
                      {product.strain.name} · {product.strain.type}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Product Details & Pricing (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Brand Header */}
              {product.brand && (
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Award className="h-4 w-4" />
                  <span>{product.brand.name}</span>
                </div>
              )}

              {/* Product Headline */}
              <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-normal leading-tight tracking-tight text-foreground">
                {product.name}
              </h1>

              {/* Potency & Weight Specs Grid */}
              <div className="flex flex-wrap items-center gap-3">
                {product.thcPercent && (
                  <div className="rounded-xl border border-border bg-card px-3.5 py-2 text-center shadow-xs">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      THC
                    </div>
                    <div className="font-heading text-base text-foreground">
                      {product.thcPercent}%
                    </div>
                  </div>
                )}

                {product.cbdPercent && parseFloat(product.cbdPercent) > 0 && (
                  <div className="rounded-xl border border-border bg-card px-3.5 py-2 text-center shadow-xs">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      CBD
                    </div>
                    <div className="font-heading text-base text-foreground">
                      {product.cbdPercent}%
                    </div>
                  </div>
                )}

                {product.weightGrams && (
                  <div className="rounded-xl border border-border bg-card px-3.5 py-2 text-center shadow-xs">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      Net Weight
                    </div>
                    <div className="font-heading text-base text-foreground flex items-center justify-center">
                      <Scale className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                      {product.weightGrams}g
                    </div>
                  </div>
                )}

                {product.sku && (
                  <div className="rounded-xl border border-border bg-card px-3.5 py-2 text-center shadow-xs">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      SKU
                    </div>
                    <div className="text-xs font-mono text-muted-foreground mt-0.5">
                      {product.sku}
                    </div>
                  </div>
                )}
              </div>

              {/* Price Callout */}
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="font-heading text-3xl sm:text-4xl font-normal text-foreground">
                    ${isOwtletPrice ? product.owtletPrice : product.fromPrice || '—'}
                  </span>
                  {isOwtletPrice ? (
                    <Badge variant="default" className="text-xs font-bold">
                      One Price at Every Partner Store
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Lowest in-stock dispensary price
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {isOwtletPrice
                    ? 'Show products feature standardized pricing across all participating licensed dispensaries.'
                    : 'Dispensary pricing may vary slightly based on fulfillment method and location.'}
                </p>
              </div>

              {/* Description */}
              {product.description && (
                <div className="space-y-2">
                  <h3 className="font-heading text-sm text-foreground uppercase tracking-wider">
                    About this craft strain
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Compliance Box */}
              <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-owtlet-ink">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>21+ Adult-Use Compliance:</strong> Owtlet facilitates reservations with licensed New York State dispensaries. ID verification and transaction completion occur directly with the dispensary at pickup or delivery.
                </p>
              </div>
            </div>
          </div>

          {/* Dispensary Availability Section */}
          <div className="pt-6 border-t border-border">
            <StoreAvailabilityList
              productSlug={product.slug}
              initialAvailability={product.availability}
              priceMode={product.priceMode}
              owtletPrice={product.owtletPrice}
            />
          </div>
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}

