import * as React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ShieldCheck, Zap } from 'lucide-react';
import { serverFetch } from '@/lib/server-api';
import { ProductDetailDto } from '@/types/api.generated';
import { StoreHeader } from '@/components/layout/store-header';
import { StoreFooter } from '@/components/layout/store-footer';
import {
  ConnectedStoreAvailability,
  ProductBuyBox,
  ProductPurchaseProvider,
} from '@/components/catalog/product-purchase';
import { FallbackImage } from '@/components/ui/fallback-image';
import { StrainBadge, strainTint } from '@/components/ui/strain-badge';
import { categoryPhoto } from '@/lib/brand-photos';
import { cn, formatPct } from '@/lib/utils';

export interface ProductPageProps {
  params: {
    slug: string;
  };
  searchParams?: {
    zip?: string;
  };
}

export async function generateMetadata({ params, searchParams }: ProductPageProps): Promise<Metadata> {
  const query = searchParams?.zip ? `?zip=${encodeURIComponent(searchParams.zip)}` : '';
  const product = await serverFetch<ProductDetailDto>(`/products/${params.slug}${query}`).catch(() => null);

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

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-muted px-3 py-3 text-center">
      <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className="mt-0.5 font-mono text-lg font-bold tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

export default async function ProductDetailPage({ params, searchParams }: ProductPageProps) {
  const query = searchParams?.zip ? `?zip=${encodeURIComponent(searchParams.zip)}` : '';
  let product: ProductDetailDto;
  try {
    product = await serverFetch<ProductDetailDto>(`/products/${params.slug}${query}`);
  } catch (error: any) {
    if (error?.status === 404 || error?.code === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }

  const isOwtletPrice = !!(product.priceMode === 'OWTLET' && product.owtletPrice);
  const price = isOwtletPrice ? product.owtletPrice : product.fromPrice;
  const inStockCount = product.availability.filter((a) => a.inStock).length;

  const specs: { label: string; value: string }[] = [];
  if (product.thcPercent) specs.push({ label: 'THC', value: `${formatPct(product.thcPercent)}%` });
  if (product.cbdPercent && parseFloat(product.cbdPercent) > 0) specs.push({ label: 'CBD', value: `${formatPct(product.cbdPercent)}%` });
  if (product.weightGrams) specs.push({ label: 'Net weight', value: `${parseFloat(product.weightGrams)}g` });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StoreHeader />

      <main className="flex-1">
        <ProductPurchaseProvider availability={product.availability}>
          <div className="mx-auto max-w-content space-y-12 px-4 py-6 sm:px-7 lg:py-8">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs font-semibold text-muted">
              <Link href="/shop" className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Shop
              </Link>
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
              <Link
                href={`/shop/${product.category.slug}`}
                className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {product.category.name}
              </Link>
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
              <span className="max-w-[12rem] truncate text-foreground sm:max-w-xs" aria-current="page">
                {product.name}
              </span>
            </nav>

            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
              {/* Media */}
              <div className="lg:sticky lg:top-36">
                <div className={cn('relative aspect-square w-full overflow-hidden rounded-3xl', strainTint(product.strain?.type))}>
                  <FallbackImage
                    src={product.imageUrls?.[0]}
                    fallback={categoryPhoto(product.category.slug)}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                  {isOwtletPrice ? (
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-bold text-owtlet-mist">
                      <Zap className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      Featured in live shows
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {product.strain ? <StrainBadge type={product.strain.type} /> : null}
                    <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-foreground">
                      {product.category.name}
                    </span>
                  </div>
                  <h1 className="font-heading text-3xl leading-tight tracking-tight text-foreground text-balance sm:text-4xl">
                    {product.name}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {product.brand ? (
                      <>
                        by <span className="font-bold text-foreground">{product.brand.name}</span>
                      </>
                    ) : null}
                    {product.brand && product.strain ? ' · ' : null}
                    {product.strain ? <span className="font-mono">{product.strain.name}</span> : null}
                  </p>
                </div>

                {specs.length > 0 ? (
                  <dl className={cn('grid gap-2', specs.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
                    {specs.map((s) => (
                      <Spec key={s.label} {...s} />
                    ))}
                  </dl>
                ) : null}

                <ProductBuyBox
                  productId={product.id}
                  productName={product.name}
                  price={price ?? null}
                  isOwtletPrice={isOwtletPrice}
                />

                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span
                    className={cn('h-2 w-2 rounded-full', inStockCount > 0 ? 'bg-success' : 'bg-muted')}
                    aria-hidden="true"
                  />
                  {inStockCount > 0
                    ? `In stock at ${inStockCount} partner store${inStockCount > 1 ? 's' : ''} · pick your store below`
                    : 'Not in stock at partner stores right now'}
                </p>

                {product.description ? (
                  <div className="space-y-2 border-t border-border pt-6">
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">About this product</h2>
                    <p className="text-sm leading-relaxed text-foreground/90">{product.description}</p>
                  </div>
                ) : null}

                {product.sku ? (
                  <p className="font-mono text-xs text-muted">SKU {product.sku}</p>
                ) : null}

                <div className="flex items-start gap-3 rounded-2xl bg-surface-muted p-4 text-xs leading-relaxed text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                  <p>
                    <strong className="text-foreground">21+ Adult-Use Compliance:</strong> Owtlet facilitates reservations with
                    licensed New York State dispensaries. ID verification and transaction completion occur directly with the
                    dispensary at pickup or delivery.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-10">
              <ConnectedStoreAvailability
                productSlug={product.slug}
                priceMode={product.priceMode}
                owtletPrice={product.owtletPrice}
              />
            </div>
          </div>
        </ProductPurchaseProvider>
      </main>

      <StoreFooter />
    </div>
  );
}
