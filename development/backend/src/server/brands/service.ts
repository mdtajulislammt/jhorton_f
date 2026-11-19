import { prisma } from '../db';
import { listProducts } from '../products';
import { listLiveShows } from '../live-shows';
import { BrandSummaryDto, BrandDispensarySummaryDto, BrandStorefrontDto } from './types';

export class BrandNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Brand not found or inactive: ${identifier}`);
    this.name = 'BrandNotFoundError';
  }
}

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

  const productsResult = await listProducts({
    brand: brand.slug,
    limit: 100,
  });

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

