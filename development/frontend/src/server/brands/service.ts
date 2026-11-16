import { prisma } from '../db';
import { listProducts, ProductSummaryDto } from '../products';
import { listLiveShows, LiveShowDto } from '../live-shows';
import { BrandSummaryDto, BrandDispensarySummaryDto, BrandStorefrontDto } from './types';

export class BrandNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Brand not found or inactive: ${identifier}`);
    this.name = 'BrandNotFoundError';
  }
}

/**
 * List all active brands ordered by sortOrder then name (docs/08 §12).
 */
export async function listActiveBrands(): Promise<BrandSummaryDto[]> {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      bannerUrl: true,
      sortOrder: true,
    },
  });

  return brands;
}

/**
 * Retrieve a brand storefront by slug (docs/08 §12).
 * Returns brand metadata, active products, assigned partner dispensaries, and brand shows/videos.
 * Throws BrandNotFoundError (404) if not found or inactive.
 */
export async function getBrandStorefront(slug: string): Promise<BrandStorefrontDto> {
  const brand = await prisma.brand.findUnique({
    where: { slug },
    include: {
      dispensaries: {
        include: {
          dispensary: {
            select: {
              id: true,
              name: true,
              slug: true,
              zip: true,
              city: true,
              offersPickup: true,
              offersDelivery: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (!brand || !brand.isActive) {
    throw new BrandNotFoundError(slug);
  }

  // Fetch brand's products via listProducts
  const productsResult = await listProducts({
    brand: brand.slug,
    limit: 100,
  });

  // Fetch brand's live shows & shoppable videos
  const shows = await listLiveShows({
    brand: brand.slug,
  });

  const partnerDispensaries: BrandDispensarySummaryDto[] = brand.dispensaries
    .filter((bd) => bd.dispensary.isActive)
    .map((bd) => ({
      id: bd.dispensary.id,
      name: bd.dispensary.name,
      slug: bd.dispensary.slug,
      zip: bd.dispensary.zip,
      city: bd.dispensary.city,
      offersPickup: bd.dispensary.offersPickup,
      offersDelivery: bd.dispensary.offersDelivery,
    }));

  return {
    brand: {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      logoUrl: brand.logoUrl,
      bannerUrl: brand.bannerUrl,
      sortOrder: brand.sortOrder,
    },
    products: productsResult.items,
    dispensaries: partnerDispensaries,
    shows,
  };
}

