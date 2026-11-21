import { FulfillmentType, HandoffChannel, HoursKind } from '@prisma/client';

export interface HoursWindowDto {
  opensAt: string;
  closesAt: string;
}

export interface DispensaryItemDto {
  id: string;
  name: string;
  slug: string;
  licenseNumber: string | null;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  latitude: number | null;
  longitude: number | null;
  offersPickup: boolean;
  offersDelivery: boolean;
  coverageZips: string[];
  isOpenNow: boolean;
  hoursToday: HoursWindowDto | null;
  isDeliveringNow: boolean;
  deliveryHoursToday: HoursWindowDto | null;
  distanceMiles: number | null;
  handoffChannel: HandoffChannel;
  websiteUrl?: string | null;
  handoffUrlTemplate?: string | null;
}

export interface FindEligibleOptions {
  fulfillmentType: 'DELIVERY' | 'PICKUP' | FulfillmentType;
  zip?: string;
  brandId?: string;
  brandSlug?: string;
  now?: Date;
}

export interface EligibleDispensariesResult {
  zip: string | null;
  region: string | null;
  items: DispensaryItemDto[];
}

export class NoCoverageError extends Error {
  readonly code = 'NO_COVERAGE';
  readonly zip: string;

  constructor(zip: string) {
    super(
      `Delivery is not available in ZIP ${zip}. Coverage is limited to Manhattan, Queens, Brooklyn, Westchester, and Long Island.`
    );
    this.name = 'NoCoverageError';
    this.zip = zip;
  }
}

