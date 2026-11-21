import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/server/db';
import {
  findEligible,
  calculateDistanceMiles,
  NoCoverageError,
} from '@/server/dispensaries';

vi.mock('@/server/db', () => ({
  prisma: {
    coverageZip: {
      findUnique: vi.fn(),
    },
    dispensary: {
      findMany: vi.fn(),
    },
  },
}));

describe('Dispensary Eligibility & Distance (T-DST-03, T-FUL-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Distance Calculation (Haversine Formula)', () => {
    it('calculates accurate distance between Manhattan and Brooklyn centroids', () => {
      // 10001 (Midtown Manhattan: ~40.7505, -73.9934) to 11201 (Downtown Brooklyn: ~40.6958, -73.9892)
      // Straight line distance is approximately 3.8 miles
      const distance = calculateDistanceMiles(40.7505, -73.9934, 40.6958, -73.9892);
      expect(distance).toBeGreaterThan(3.5);
      expect(distance).toBeLessThan(4.2);
    });

    it('returns 0.0 for identical coordinates', () => {
      const distance = calculateDistanceMiles(40.7384, -73.9928, 40.7384, -73.9928);
      expect(distance).toBe(0);
    });
  });

  describe('Coverage Gate & ZIP Filter (T-DST-03)', () => {
    it('throws NoCoverageError for DELIVERY to a ZIP outside the 5 NY regions', async () => {
      (prisma.coverageZip.findUnique as any).mockResolvedValue(null);

      await expect(
        findEligible({
          fulfillmentType: 'DELIVERY',
          zip: '90210', // Beverly Hills CA
        })
      ).rejects.toThrow(NoCoverageError);

      expect(prisma.dispensary.findMany).not.toHaveBeenCalled();
    });

    it('throws Error if ZIP is missing for DELIVERY fulfillment', async () => {
      await expect(
        findEligible({
          fulfillmentType: 'DELIVERY',
        })
      ).rejects.toThrow(/ZIP code is required/);
    });

    it('allows valid NY coverage ZIP for DELIVERY and queries covering stores', async () => {
      (prisma.coverageZip.findUnique as any).mockResolvedValue({
        zip: '11201',
        region: 'BROOKLYN',
        latitude: 40.6958,
        longitude: -73.9892,
      });

      (prisma.dispensary.findMany as any).mockResolvedValue([
        {
          id: 'disp-gotham',
          name: 'Gotham Greenery',
          slug: 'gotham-greenery',
          licenseNumber: 'OCM-001',
          addressLine1: '120 5th Ave',
          city: 'New York',
          state: 'NY',
          zip: '10011',
          latitude: 40.7384,
          longitude: -73.9928,
          offersPickup: true,
          offersDelivery: true,
          coverageZips: ['11201', '10011'],
          timezone: 'America/New_York',
          handoffChannel: 'RETAILER_PAGE',
          handoffUrlTemplate: null,
          hours: [],
        },
      ]);

      const result = await findEligible({
        fulfillmentType: 'DELIVERY',
        zip: '11201',
      });

      expect(result.zip).toBe('11201');
      expect(result.region).toBe('BROOKLYN');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Gotham Greenery');
      expect(result.items[0].offersDelivery).toBe(true);
      expect(result.items[0].distanceMiles).not.toBeNull();

      expect(prisma.dispensary.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          offersDelivery: true,
          coverageZips: { has: '11201' },
        },
        include: { hours: true },
      });
    });
  });

  describe('Fulfillment Candidates & Sorting (T-FUL-01)', () => {
    it('queries stores with offersPickup and sorts nearest first for PICKUP', async () => {
      // Downtown Brooklyn shopper
      (prisma.coverageZip.findUnique as any).mockResolvedValue({
        zip: '11201',
        region: 'BROOKLYN',
        latitude: 40.6958,
        longitude: -73.9892,
      });

      const storeFar = {
        id: 'disp-queens',
        name: 'Queens Express',
        slug: 'queens-express',
        addressLine1: '30-30 47th Ave',
        city: 'Long Island City',
        state: 'NY',
        zip: '11101',
        latitude: 40.7423,
        longitude: -73.9318,
        offersPickup: true,
        offersDelivery: true,
        coverageZips: ['11101'],
        timezone: 'America/New_York',
        handoffChannel: 'RETAILER_PAGE',
        hours: [],
      };

      const storeNear = {
        id: 'disp-brooklyn',
        name: 'Kings County Botanicals',
        slug: 'kings-county',
        addressLine1: '245 Bedford Ave',
        city: 'Brooklyn',
        state: 'NY',
        zip: '11211',
        latitude: 40.7163,
        longitude: -73.9592,
        offersPickup: true,
        offersDelivery: false,
        coverageZips: [],
        timezone: 'America/New_York',
        handoffChannel: 'DEEP_LINK',
        hours: [],
      };

      // Mock returns stores in arbitrary order
      (prisma.dispensary.findMany as any).mockResolvedValue([storeFar, storeNear]);

      const result = await findEligible({
        fulfillmentType: 'PICKUP',
        zip: '11201',
      });

      expect(prisma.dispensary.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          offersPickup: true,
        },
        include: { hours: true },
      });

      expect(result.items).toHaveLength(2);
      // Kings County (Brooklyn) should be nearer than Queens Express
      expect(result.items[0].name).toBe('Kings County Botanicals');
      expect(result.items[1].name).toBe('Queens Express');
      expect(result.items[0].distanceMiles!).toBeLessThan(result.items[1].distanceMiles!);
    });

    it('accepts PICKUP without ZIP and sorts alphabetically by name', async () => {
      const storeB = {
        id: 'disp-b',
        name: 'Botanical Bloom',
        slug: 'botanical-bloom',
        addressLine1: '100 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        latitude: 40.75,
        longitude: -73.99,
        offersPickup: true,
        offersDelivery: false,
        coverageZips: [],
        timezone: 'America/New_York',
        handoffChannel: 'RETAILER_PAGE',
        hours: [],
      };

      const storeA = {
        id: 'disp-a',
        name: 'Apex Greenery',
        slug: 'apex-greenery',
        addressLine1: '200 Broadway',
        city: 'New York',
        state: 'NY',
        zip: '10002',
        latitude: 40.71,
        longitude: -74.0,
        offersPickup: true,
        offersDelivery: false,
        coverageZips: [],
        timezone: 'America/New_York',
        handoffChannel: 'RETAILER_PAGE',
        hours: [],
      };

      (prisma.dispensary.findMany as any).mockResolvedValue([storeB, storeA]);

      const result = await findEligible({
        fulfillmentType: 'PICKUP',
      });

      expect(result.zip).toBeNull();
      expect(result.region).toBeNull();
      expect(result.items[0].name).toBe('Apex Greenery');
      expect(result.items[1].name).toBe('Botanical Bloom');
      expect(result.items[0].distanceMiles).toBeNull();
    });
  });

  describe('Brand Channel Scoping', () => {
    it('applies brand relation filter when brandSlug is specified', async () => {
      (prisma.coverageZip.findUnique as any).mockResolvedValue({
        zip: '10011',
        region: 'MANHATTAN',
        latitude: 40.7384,
        longitude: -73.9928,
      });

      (prisma.dispensary.findMany as any).mockResolvedValue([]);

      await findEligible({
        fulfillmentType: 'PICKUP',
        zip: '10011',
        brandSlug: 'grand-national',
      });

      expect(prisma.dispensary.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          offersPickup: true,
          brands: {
            some: {
              brand: {
                slug: 'grand-national',
                isActive: true,
              },
            },
          },
        },
        include: { hours: true },
      });
    });
  });
});

