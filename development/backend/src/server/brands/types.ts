export interface BrandSummaryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  sortOrder: number;
}

export interface BrandDispensarySummaryDto {
  id: string;
  name: string;
  slug: string;
  zip: string;
  city: string;
  offersPickup: boolean;
  offersDelivery: boolean;
}

export interface BrandStorefrontDto {
  brand: BrandSummaryDto;
  products: any[];
  dispensaries: BrandDispensarySummaryDto[];
  shows: any[];
}

