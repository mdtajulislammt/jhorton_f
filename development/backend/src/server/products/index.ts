import { prisma } from '../db';
import { StrainType, Prisma } from '@prisma/client';
import {
  computeCatalogPricing,
  resolveUnitPrice,
  formatMoney,
  PriceMode,
} from '../pricing';

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: { select: { slug: true; name: true } };
    strain: { select: { name: true; type: true } };
    brand: { select: { slug: true; name: true } };
    inventory: {
      include: {
        dispensary: true;
      };
    };
  };
}>;

export interface ProductListFilters {
  category?: string;
  strainType?: StrainType | string;
  minThc?: number;
  maxThc?: number;
  brand?: string;
  q?: string;
  cursor?: string;
  limit?: number;
  includeInactive?: boolean;
}

export interface ProductSummaryDto {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: {
    slug: string;
    name: string;
  };
  strain: {
    name: string;
    type: StrainType;
  } | null;
  thcPercent: string | null;
  cbdPercent: string | null;
  weightGrams: string | null;
  imageUrls: string[];
  brand: {
    slug: string;
    name: string;
  } | null;
  priceMode: PriceMode;
  owtletPrice: string | null;
  fromPrice: string | null;
  availableAtCount: number;
}

export interface StoreAvailabilityDto {
  dispensaryId: string;
  dispensaryName: string;
  dispensarySlug: string;
  price: string;
  inStock: boolean;
  stockQty: number;
  offersPickup: boolean;
  offersDelivery: boolean;
  deliversToZip: boolean;
  distanceMiles: number | null;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
}

export interface ProductDetailDto extends ProductSummaryDto {
  sku: string | null;
  terrificProductId: string | null;
  availability: StoreAvailabilityDto[];
}

export interface ProductListResult {
  items: ProductSummaryDto[];
  nextCursor: string | null;
  total?: number;
}

/**
 * Calculates straight-line distance in miles between two latitude/longitude points.
 */
export function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Lists products from the catalog with filtering and cursor-based pagination.
 */
export async function listProducts(
  filters: ProductListFilters = {}
): Promise<ProductListResult> {
  const limit = Math.min(Math.max(filters.limit || 24, 1), 100);
  const where: any = {};

  if (!filters.includeInactive) {
    where.isActive = true;
  }

  if (filters.category) {
    where.category = { slug: filters.category };
  }

  if (filters.strainType) {
    const upper = filters.strainType.toUpperCase();
    if (Object.values(StrainType).includes(upper as StrainType)) {
      where.strain = { type: upper as StrainType };
    }
  }

  if (filters.minThc !== undefined || filters.maxThc !== undefined) {
    where.thcPercent = {};
    if (filters.minThc !== undefined) {
      where.thcPercent.gte = filters.minThc;
    }
    if (filters.maxThc !== undefined) {
      where.thcPercent.lte = filters.maxThc;
    }
  }

  if (filters.brand) {
    where.brand = { slug: filters.brand };
  }

  if (filters.q && filters.q.trim()) {
    const query = filters.q.trim();
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { strain: { name: { contains: query, mode: 'insensitive' } } },
      { category: { name: { contains: query, mode: 'insensitive' } } },
      { brand: { name: { contains: query, mode: 'insensitive' } } },
    ];
  }

  const queryArgs: any = {
    where,
    take: limit + 1,
    orderBy: { createdAt: 'desc' },
    include: {
      category: { select: { slug: true, name: true } },
      strain: { select: { name: true, type: true } },
      brand: { select: { slug: true, name: true } },
      inventory: {
        include: {
          dispensary: true,
        },
      },
    },
  };

  if (filters.cursor) {
    queryArgs.cursor = { id: filters.cursor };
    queryArgs.skip = 1;
  }

  const products = (await prisma.product.findMany(queryArgs)) as unknown as ProductWithRelations[];

  const hasNextPage = products.length > limit;
  const itemsToReturn = hasNextPage ? products.slice(0, limit) : products;
  const nextCursor = hasNextPage ? itemsToReturn[itemsToReturn.length - 1].id : null;

  const items: ProductSummaryDto[] = itemsToReturn.map((product) => {
    const activeInventories = product.inventory.filter((inv) => inv.dispensary.isActive);
    const availableAtCount = activeInventories.filter((inv) => inv.stockQty > 0).length;
    const pricing = computeCatalogPricing(product, activeInventories);

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      category: {
        slug: product.category.slug,
        name: product.category.name,
      },
      strain: product.strain
        ? {
            name: product.strain.name,
            type: product.strain.type,
          }
        : null,
      thcPercent: product.thcPercent ? formatMoney(product.thcPercent) : null,
      cbdPercent: product.cbdPercent ? formatMoney(product.cbdPercent) : null,
      weightGrams: product.weightGrams ? formatMoney(product.weightGrams) : null,
      imageUrls: product.imageUrls,
      brand: product.brand
        ? {
            slug: product.brand.slug,
            name: product.brand.name,
          }
        : null,
      priceMode: pricing.priceMode,
      owtletPrice: pricing.owtletPrice,
      fromPrice: pricing.fromPrice,
      availableAtCount,
    };
  });

  return {
    items,
    nextCursor,
  };
}

/**
 * Retrieves full product details by slug, including inventory availability per dispensary.
 * If a 5-digit ZIP is provided, delivery eligibility and distance are computed.
 */
export async function getProductBySlug(
  slug: string,
  options: { zip?: string } = {}
): Promise<ProductDetailDto | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: { select: { slug: true, name: true } },
      strain: { select: { name: true, type: true } },
      brand: { select: { slug: true, name: true } },
      inventory: {
        include: {
          dispensary: true,
        },
      },
    },
  });

  if (!product || !product.isActive) {
    return null;
  }

  // Lookup target ZIP coordinates if requested
  let targetCoords: { latitude: number; longitude: number } | null = null;
  if (options.zip) {
    const cleanZip = options.zip.trim();
    const zipRecord = await prisma.coverageZip.findUnique({
      where: { zip: cleanZip },
    });
    if (zipRecord && zipRecord.latitude && zipRecord.longitude) {
      targetCoords = {
        latitude: Number(zipRecord.latitude),
        longitude: Number(zipRecord.longitude),
      };
    }
  }

  const activeInventories = product.inventory.filter((inv) => inv.dispensary.isActive);
  const availableAtCount = activeInventories.filter((inv) => inv.stockQty > 0).length;
  const pricing = computeCatalogPricing(product, activeInventories);

  const availability: StoreAvailabilityDto[] = activeInventories.map((inv) => {
    const disp = inv.dispensary;
    const price = resolveUnitPrice(product, inv);
    const inStock = inv.stockQty > 0;

    let deliversToZip = disp.offersDelivery;
    if (options.zip) {
      deliversToZip = disp.offersDelivery && disp.coverageZips.includes(options.zip.trim());
    }

    let distanceMiles: number | null = null;
    if (targetCoords && disp.latitude && disp.longitude) {
      distanceMiles = calculateDistanceMiles(
        targetCoords.latitude,
        targetCoords.longitude,
        Number(disp.latitude),
        Number(disp.longitude)
      );
    }

    return {
      dispensaryId: disp.id,
      dispensaryName: disp.name,
      dispensarySlug: disp.slug,
      price,
      inStock,
      stockQty: inv.stockQty,
      offersPickup: disp.offersPickup,
      offersDelivery: disp.offersDelivery,
      deliversToZip,
      distanceMiles,
      addressLine1: disp.addressLine1,
      city: disp.city,
      state: disp.state,
      zip: disp.zip,
    };
  });

  // Sort availability: in-stock first, then deliversToZip / pickup, then distance/name
  availability.sort((a, b) => {
    if (a.inStock !== b.inStock) {
      return a.inStock ? -1 : 1;
    }
    if (options.zip && a.deliversToZip !== b.deliversToZip) {
      return a.deliversToZip ? -1 : 1;
    }
    if (a.distanceMiles !== null && b.distanceMiles !== null) {
      return a.distanceMiles - b.distanceMiles;
    }
    return a.dispensaryName.localeCompare(b.dispensaryName);
  });

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    sku: product.sku,
    terrificProductId: product.terrificProductId,
    category: {
      slug: product.category.slug,
      name: product.category.name,
    },
    strain: product.strain
      ? {
          name: product.strain.name,
          type: product.strain.type,
        }
      : null,
    thcPercent: product.thcPercent ? formatMoney(product.thcPercent) : null,
    cbdPercent: product.cbdPercent ? formatMoney(product.cbdPercent) : null,
    weightGrams: product.weightGrams ? formatMoney(product.weightGrams) : null,
    imageUrls: product.imageUrls,
    brand: product.brand
      ? {
          slug: product.brand.slug,
          name: product.brand.name,
        }
      : null,
    priceMode: pricing.priceMode,
    owtletPrice: pricing.owtletPrice,
    fromPrice: pricing.fromPrice,
    availableAtCount,
    availability,
  };
}

export interface ResolveProductQuery {
  productId?: string;
  terrificProductId?: string;
  externalId?: string;
  sku?: string;
}

/**
 * Resolves a product by productId, terrificProductId (or externalId), or sku.
 * Used by Terrific cart sync and cart item operations (ADR-006, docs/08 §4.2).
 * Returns null if no matching active product exists.
 */
export async function resolveProduct(
  query: ResolveProductQuery
): Promise<ProductDetailDto | null> {
  const { productId, terrificProductId, externalId, sku } = query;

  let product: any = null;

  if (productId) {
    product = await prisma.product.findUnique({
      where: { id: productId },
    });
  }

  const terrificId = terrificProductId || externalId;
  if (!product && terrificId) {
    product = await prisma.product.findUnique({
      where: { terrificProductId: terrificId },
    });
  }

  if (!product && sku) {
    product = await prisma.product.findUnique({
      where: { sku },
    });
  }

  if (!product || !product.isActive) {
    return null;
  }

  return getProductBySlug(product.slug);
}
