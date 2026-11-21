import { prisma } from '../db';
import { StrainType } from '@prisma/client';

export interface SyncWooOptions {
  dryRun?: boolean;
  woocommerceUrl?: string;
  consumerKey?: string;
  consumerSecret?: string;
}

export interface SyncWooReport {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  totalProcessed: number;
  dryRun: boolean;
  details: Array<{
    sku: string;
    name: string;
    action: 'CREATED' | 'UPDATED' | 'SKIPPED' | 'ERROR';
    reason?: string;
  }>;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parsePercent(val: any): number | null {
  if (val == null) return null;
  const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? null : num;
}

/**
 * Synchronizes WooCommerce products into Owtlet's Catalog.
 * Master Key: Product.sku
 */
export async function syncWooProducts(options: SyncWooOptions = {}): Promise<SyncWooReport> {
  const isProduction = process.env.NODE_ENV === 'production';

  const wcUrl =
    options.woocommerceUrl ||
    process.env.WOOCOMMERCE_URL;
  const consumerKey =
    options.consumerKey ||
    process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret =
    options.consumerSecret ||
    process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (isProduction && (!wcUrl || !consumerKey || !consumerSecret)) {
    throw new Error(
      'CRITICAL CONFIGURATION ERROR: WOOCOMMERCE_URL, WOOCOMMERCE_CONSUMER_KEY, or WOOCOMMERCE_CONSUMER_SECRET is missing in production.'
    );
  }

  const dryRun = Boolean(options.dryRun);
  const report: SyncWooReport = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    totalProcessed: 0,
    dryRun,
    details: [],
  };

  if (!wcUrl || !consumerKey || !consumerSecret) {
    report.errors.push('WooCommerce API credentials not configured.');
    return report;
  }

  const baseUrl = wcUrl.replace(/\/+$/, '');
  const authHeader = 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  let page = 1;
  const perPage = 100;
  let hasMore = true;
  let hasFetchError = false;
  const syncedSkus = new Set<string>();

  while (hasMore) {
    const fetchUrl = `${baseUrl}/wp-json/wc/v3/products?per_page=${perPage}&page=${page}`;
    let response: Response;
    try {
      response = await fetch(fetchUrl, {
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
        },
      });
    } catch (err: any) {
      hasFetchError = true;
      report.errors.push(`Network error fetching page ${page}: ${err.message}`);
      break;
    }

    if (!response.ok) {
      hasFetchError = true;
      report.errors.push(`WooCommerce API responded with HTTP ${response.status}: ${response.statusText}`);
      break;
    }

    const products: any[] = await response.json();
    if (!Array.isArray(products) || products.length === 0) {
      hasMore = false;
      break;
    }

    for (const item of products) {
      report.totalProcessed++;

      // SKU is master key
      const rawSku = item.sku ? String(item.sku).trim() : '';
      if (!rawSku) {
        report.skipped++;
        report.details.push({
          sku: 'NO_SKU',
          name: item.name || 'Unknown',
          action: 'SKIPPED',
          reason: 'Product missing SKU master key',
        });
        continue;
      }

      // Variable products without variant SKU
      if (item.type === 'variable' && (!item.variations || item.variations.length === 0)) {
        report.skipped++;
        report.details.push({
          sku: rawSku,
          name: item.name,
          action: 'SKIPPED',
          reason: 'Variable product with no variations',
        });
        continue;
      }

      syncedSkus.add(rawSku);

      // Name & Description
      const name = item.name || 'Untitled Cannabis Product';
      const slug = item.slug || slugify(name);
      const description = item.description || item.short_description || null;

      // Price mapping: regular/sale price -> owtletPrice
      const priceStr = item.sale_price || item.regular_price || item.price;
      const owtletPrice = priceStr ? parseFloat(priceStr) : null;

      // Images
      const imageUrls = Array.isArray(item.images)
        ? item.images.map((img: any) => img.src).filter(Boolean)
        : [];

      // Stock status -> isActive
      const isActive = item.stock_status === 'instock';

      // Attributes: THC, CBD, Weight, Strain
      let thcPercent: number | null = null;
      let cbdPercent: number | null = null;
      let weightGrams: number | null = null;
      let strainTypeStr: string | null = null;

      if (Array.isArray(item.attributes)) {
        for (const attr of item.attributes) {
          const attrName = (attr.name || '').toLowerCase();
          const option = Array.isArray(attr.options) && attr.options[0] ? String(attr.options[0]) : '';
          if (attrName.includes('thc')) {
            thcPercent = parsePercent(option);
          } else if (attrName.includes('cbd')) {
            cbdPercent = parsePercent(option);
          } else if (attrName.includes('weight')) {
            weightGrams = parsePercent(option);
          } else if (attrName.includes('strain')) {
            strainTypeStr = option.toUpperCase();
          }
        }
      }

      // Category: create if missing
      const firstCat = Array.isArray(item.categories) && item.categories[0] ? item.categories[0] : null;
      const categoryName = firstCat ? firstCat.name : 'Flower';
      const categorySlug = firstCat ? firstCat.slug || slugify(firstCat.name) : 'flower';

      // Brand from attributes or tags
      let brandName: string | null = null;
      if (Array.isArray(item.tags) && item.tags.length > 0) {
        brandName = item.tags[0].name || null;
      }

      if (dryRun) {
        const existing = await prisma.product.findFirst({ where: { sku: rawSku } });
        if (existing) {
          report.updated++;
          report.details.push({ sku: rawSku, name, action: 'UPDATED' });
        } else {
          report.created++;
          report.details.push({ sku: rawSku, name, action: 'CREATED' });
        }
        continue;
      }

      try {
        // Ensure category exists
        let category = await prisma.category.findUnique({ where: { slug: categorySlug } });
        if (!category) {
          category = await prisma.category.create({
            data: {
              name: categoryName,
              slug: categorySlug,
            },
          });
        }

        // Ensure brand exists if present
        let brandId: string | null = null;
        if (brandName) {
          const brandSlug = slugify(brandName);
          let brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
          if (!brand) {
            brand = await prisma.brand.create({
              data: {
                name: brandName,
                slug: brandSlug,
              },
            });
          }
          brandId = brand.id;
        }

        // Strain resolving
        let strainId: string | null = null;
        if (strainTypeStr && ['INDICA', 'SATIVA', 'HYBRID', 'CBD'].includes(strainTypeStr)) {
          let strain = await prisma.strain.findUnique({ where: { name } });
          if (!strain) {
            strain = await prisma.strain.create({
              data: {
                name,
                type: strainTypeStr as StrainType,
              },
            });
          }
          strainId = strain.id;
        }

        const existing = await prisma.product.findFirst({ where: { sku: rawSku } });
        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              name,
              slug,
              description,
              owtletPrice,
              imageUrls,
              isActive,
              categoryId: category.id,
              brandId,
              strainId,
              thcPercent,
              cbdPercent,
              weightGrams,
            },
          });
          report.updated++;
          report.details.push({ sku: rawSku, name, action: 'UPDATED' });
        } else {
          await prisma.product.create({
            data: {
              sku: rawSku,
              name,
              slug,
              description,
              owtletPrice,
              imageUrls,
              isActive,
              categoryId: category.id,
              brandId,
              strainId,
              thcPercent,
              cbdPercent,
              weightGrams,
            },
          });
          report.created++;
          report.details.push({ sku: rawSku, name, action: 'CREATED' });
        }
      } catch (err: any) {
        report.errors.push(`Error syncing SKU ${rawSku}: ${err.message}`);
        report.details.push({ sku: rawSku, name, action: 'ERROR', reason: err.message });
      }
    }

    if (products.length < perPage) {
      hasMore = false;
    } else {
      page++;
    }
  }

  // Deactivated products that disappeared from WooCommerce
  // Only deactivate if every page fetched without errors AND report.errors is empty
  if (!dryRun && syncedSkus.size > 0 && !hasFetchError && report.errors.length === 0) {
    await prisma.product.updateMany({
      where: {
        sku: { notIn: Array.from(syncedSkus) },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });
  } else if (!dryRun && (hasFetchError || report.errors.length > 0)) {
    report.details.push({
      sku: 'ALL',
      name: 'Deactivation step skipped',
      action: 'SKIPPED',
      reason: 'Deactivation of missing products skipped due to errors during sync',
    });
  }

  return report;
}
