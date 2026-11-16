import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { calculateDistanceMiles, getZipInfo } from './distance';
import { getDispensaryHoursToday, isDeliveringNow, isOpenNow } from './hours';
import {
  DispensaryItemDto,
  EligibleDispensariesResult,
  FindEligibleOptions,
  NoCoverageError,
} from './types';

/**
 * Finds dispensaries eligible to fulfill an order for a given fulfillment type,
 * optional ZIP, and optional brand scoping.
 *
 * Requirements:
 * - DELIVERY: offersDelivery === true AND zip in coverageZips.
 *   ZIP must belong to the 5 NY coverage regions (Manhattan, Brooklyn, Queens,
 *   Westchester, Long Island) -> throws NoCoverageError (422) if outside.
 * - PICKUP: offersPickup === true. Accepts any 5-digit ZIP for distance sorting;
 *   returns nearest stores first.
 * - Brand scoping: When brandSlug or brandId is provided, limits candidates to
 *   dispensaries mapped to that brand.
 * - Evaluates store and delivery hours in America/New_York (supporting past-midnight
 *   and DST transitions).
 */
export async function findEligible(
  options: FindEligibleOptions
): Promise<EligibleDispensariesResult> {
  const { fulfillmentType, brandId, brandSlug, now = new Date() } = options;
  const cleanZip = options.zip ? options.zip.trim() : null;

  // 1. DELIVERY Validation & Coverage Gate
  if (fulfillmentType === 'DELIVERY') {
    if (!cleanZip) {
      throw new Error('ZIP code is required for DELIVERY fulfillment');
    }

    const zipInfo = await getZipInfo(cleanZip);
    if (!zipInfo) {
      // ZIP outside the 5 supported NY regions
      throw new NoCoverageError(cleanZip);
    }
  }

  // 2. Lookup ZIP coordinates for distance calculation (if ZIP provided)
  const zipInfo = cleanZip ? await getZipInfo(cleanZip) : null;
  const region = zipInfo?.region ?? null;

  // 3. Build Prisma query filters
  const where: Prisma.DispensaryWhereInput = {
    isActive: true,
  };

  // Brand channel filter
  if (brandSlug || brandId) {
    where.brands = {
      some: {
        brand: brandSlug
          ? { slug: brandSlug, isActive: true }
          : { id: brandId, isActive: true },
      },
    };
  }

  if (fulfillmentType === 'DELIVERY') {
    where.offersDelivery = true;
    where.coverageZips = {
      has: cleanZip!,
    };
  } else if (fulfillmentType === 'PICKUP') {
    where.offersPickup = true;
  }

  // 4. Fetch candidate dispensaries with operational hours
  const dispensaries = await prisma.dispensary.findMany({
    where,
    include: {
      hours: true,
    },
  });

  // 5. Transform and evaluate hours, status, and distance
  const items: DispensaryItemDto[] = dispensaries.map((disp) => {
    let distanceMiles: number | null = null;
    if (zipInfo?.coordinates && disp.latitude && disp.longitude) {
      distanceMiles = calculateDistanceMiles(
        zipInfo.coordinates.latitude,
        zipInfo.coordinates.longitude,
        Number(disp.latitude),
        Number(disp.longitude)
      );
    }

    const timeZone = disp.timezone || 'America/New_York';
    const storeOpen = isOpenNow(disp.hours, now, timeZone);
    const storeHours = getDispensaryHoursToday(disp.hours, 'STORE', now, timeZone);

    const deliveryOpen = disp.offersDelivery
      ? isDeliveringNow(disp.hours, now, timeZone)
      : false;
    const deliveryHours = disp.offersDelivery
      ? getDispensaryHoursToday(disp.hours, 'DELIVERY', now, timeZone)
      : null;

    return {
      id: disp.id,
      name: disp.name,
      slug: disp.slug,
      licenseNumber: disp.licenseNumber,
      addressLine1: disp.addressLine1,
      city: disp.city,
      state: disp.state,
      zip: disp.zip,
      latitude: disp.latitude ? Number(disp.latitude) : null,
      longitude: disp.longitude ? Number(disp.longitude) : null,
      offersPickup: disp.offersPickup,
      offersDelivery: disp.offersDelivery,
      coverageZips: disp.coverageZips,
      isOpenNow: storeOpen,
      hoursToday: storeHours,
      isDeliveringNow: deliveryOpen,
      deliveryHoursToday: deliveryHours,
      distanceMiles,
      handoffChannel: disp.handoffChannel,
      handoffUrlTemplate: disp.handoffUrlTemplate,
    };
  });

  // 6. Sort results:
  // For PICKUP: nearest stores first (by distanceMiles asc); if distance equal or null, sort by name.
  // For DELIVERY: nearest stores first (by distanceMiles asc); then by name.
  items.sort((a, b) => {
    if (a.distanceMiles !== null && b.distanceMiles !== null) {
      return a.distanceMiles - b.distanceMiles;
    }
    if (a.distanceMiles !== null) return -1;
    if (b.distanceMiles !== null) return 1;
    return a.name.localeCompare(b.name);
  });

  return {
    zip: cleanZip,
    region,
    items,
  };
}

