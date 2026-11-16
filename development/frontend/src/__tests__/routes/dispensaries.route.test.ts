import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/server/dispensaries', () => {
  class MockNoCoverageError extends Error {
    code = 'NO_COVERAGE';
    zip: string;
    constructor(zip: string) {
      super(
        `Delivery is not available in ZIP ${zip}. Coverage is limited to Manhattan, Queens, Brooklyn, Westchester, and Long Island.`
      );
      this.name = 'NoCoverageError';
      this.zip = zip;
    }
  }

  return {
    findEligible: vi.fn(),
    NoCoverageError: MockNoCoverageError,
  };
});

import { findEligible, NoCoverageError } from '@/server/dispensaries';
import { GET } from '@/app/api/dispensaries/route';

describe('Dispensaries Route Handler (GET /api/dispensaries, docs/08-api-contract.md §6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with eligible stores for valid DELIVERY request', async () => {
    const mockData = {
      zip: '11201',
      region: 'BROOKLYN',
      items: [
        {
          id: 'disp-1',
          name: 'Gotham Greenery',
          slug: 'gotham-greenery',
          offersPickup: true,
          offersDelivery: true,
          isOpenNow: true,
          hoursToday: { opensAt: '09:00', closesAt: '22:00' },
          isDeliveringNow: true,
          deliveryHoursToday: { opensAt: '11:00', closesAt: '21:00' },
          distanceMiles: 1.8,
          handoffChannel: 'RETAILER_PAGE',
        },
      ],
    };
    (findEligible as any).mockResolvedValue(mockData);

    const req = new NextRequest(
      'http://localhost:3000/api/dispensaries?zip=11201&fulfillment=DELIVERY'
    );
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.zip).toBe('11201');
    expect(json.data.region).toBe('BROOKLYN');
    expect(json.data.items).toHaveLength(1);
    expect(json.data.items[0].name).toBe('Gotham Greenery');
    expect(findEligible).toHaveBeenCalledWith({
      fulfillmentType: 'DELIVERY',
      zip: '11201',
      brandSlug: undefined,
    });
  });

  it('returns 200 for PICKUP request with optional brand filter', async () => {
    const mockData = {
      zip: null,
      region: null,
      items: [],
    };
    (findEligible as any).mockResolvedValue(mockData);

    const req = new NextRequest(
      'http://localhost:3000/api/dispensaries?fulfillment=PICKUP&brand=grand-national'
    );
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(findEligible).toHaveBeenCalledWith({
      fulfillmentType: 'PICKUP',
      zip: undefined,
      brandSlug: 'grand-national',
    });
  });

  it('returns 422 NO_COVERAGE when destination ZIP is outside 5 NY regions', async () => {
    (findEligible as any).mockRejectedValue(new NoCoverageError('90210'));

    const req = new NextRequest(
      'http://localhost:3000/api/dispensaries?zip=90210&fulfillment=DELIVERY'
    );
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(422);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('NO_COVERAGE');
    expect(json.error.message).toContain('90210');
  });

  it('returns 400 VALIDATION_ERROR when DELIVERY is requested without a ZIP code', async () => {
    const req = new NextRequest('http://localhost:3000/api/dispensaries?fulfillment=DELIVERY');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(json.error.message).toContain('ZIP code is required');
  });

  it('returns 400 VALIDATION_ERROR when ZIP format is invalid (not 5 digits)', async () => {
    const req = new NextRequest('http://localhost:3000/api/dispensaries?zip=123');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });
});

