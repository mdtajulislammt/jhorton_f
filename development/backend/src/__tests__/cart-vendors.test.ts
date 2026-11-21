import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssignmentSource } from '@prisma/client';
import { prisma } from '../server/db';
import { getCartVendors, setCartVendor, getCartVendorWarnings } from '../server/cart/vendors';

vi.mock('../server/db', () => ({
  prisma: {
    cart: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    shopper: {
      findUnique: vi.fn(),
    },
    dispensary: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    vendorProductMapping: {
      findMany: vi.fn(),
    },
    coverageZip: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Cart Vendor Selection & Warnings (Single Vendor Per Cart)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCart = {
    id: 'cart-1',
    sessionToken: 'sess-token-1',
    status: 'ACTIVE',
    selectedDispensaryId: null,
    selectionSource: null,
    lastActivityAt: new Date(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        quantity: 2,
        product: {
          id: 'prod-1',
          name: 'Blue Dream',
          sku: 'SKU-BD-01',
          owtletPrice: 35,
          imageUrls: [],
          category: { name: 'Flower', slug: 'flower' },
          strain: null,
          brand: null,
          inventory: [],
        },
      },
    ],
  };

  const mockDispensaries = [
    {
      id: 'disp-1',
      name: 'Cannablooms',
      slug: 'cannablooms',
      addressLine1: '2400 N Ocean Ave',
      city: 'Farmingville',
      zip: '11738',
      latitude: 40.825,
      longitude: -73.041,
      isActive: true,
      offersDelivery: true,
      timezone: 'America/New_York',
      hours: [
        {
          kind: 'STORE',
          dayOfWeek: new Date().getDay(),
          opensAt: '08:00',
          closesAt: '24:00',
          isClosed: false,
        },
      ],
    },
    {
      id: 'disp-2',
      name: 'Culture House',
      slug: 'culture-house',
      addressLine1: '807 Manhattan Ave',
      city: 'Brooklyn',
      zip: '11222',
      latitude: 40.728,
      longitude: -73.953,
      isActive: true,
      offersDelivery: false,
      timezone: 'America/New_York',
      hours: [
        {
          kind: 'STORE',
          dayOfWeek: new Date().getDay(),
          opensAt: '09:00',
          closesAt: '22:00',
          isClosed: false,
        },
      ],
    },
  ];

  it('GET cart vendors without location returns unsorted dispensaries with no preselection', async () => {
    vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart as any);
    vi.mocked(prisma.dispensary.findMany).mockResolvedValue(mockDispensaries as any);
    vi.mocked(prisma.vendorProductMapping.findMany).mockResolvedValue([
      {
        id: 'vpm-1',
        productId: 'prod-1',
        dispensaryId: 'disp-1',
        isAvailable: true,
      } as any,
    ]);

    const result = await getCartVendors('sess-token-1');

    expect(result.vendors).toHaveLength(2);
    expect(result.selectedDispensaryId).toBeNull();
    expect(result.vendors.some((v) => v.isPreselected)).toBe(false);
    expect(result.vendors[0].mappedItemCount).toBe(1);
    expect(result.vendors[1].mappedItemCount).toBe(0);
  });

  it('GET cart vendors with coordinates sorts by distance and preselects nearest', async () => {
    vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart as any);
    vi.mocked(prisma.dispensary.findMany).mockResolvedValue(mockDispensaries as any);
    vi.mocked(prisma.vendorProductMapping.findMany).mockResolvedValue([]);
    vi.mocked(prisma.cart.update).mockResolvedValue(mockCart as any);

    // Near Brooklyn (disp-2 is closer)
    const result = await getCartVendors('sess-token-1', {
      lat: 40.73,
      lng: -73.95,
    });

    expect(result.vendors[0].dispensaryId).toBe('disp-2');
    expect(result.vendors[0].isPreselected).toBe(true);
    expect(result.selectedDispensaryId).toBe('disp-2');
    expect(result.selectionSource).toBe(AssignmentSource.AUTO);
  });

  it('sets cart vendor with SHOPPER_CHANGED source', async () => {
    vi.mocked(prisma.dispensary.findFirst).mockResolvedValue(mockDispensaries[0] as any);
    vi.mocked(prisma.cart.update).mockResolvedValue({
      ...mockCart,
      selectedDispensaryId: 'disp-1',
      selectionSource: AssignmentSource.SHOPPER_CHANGED,
      items: [],
      liveShow: null,
    } as any);

    const res = await setCartVendor('sess-token-1', 'disp-1');
    expect(prisma.cart.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sessionToken: 'sess-token-1' },
        data: expect.objectContaining({
          selectedDispensaryId: 'disp-1',
          selectionSource: AssignmentSource.SHOPPER_CHANGED,
        }),
      })
    );
    expect(res.selectedDispensaryId).toBe('disp-1');
  });

  it('returns warnings for unmapped or unavailable cart products', async () => {
    vi.mocked(prisma.cart.findUnique).mockResolvedValue({
      ...mockCart,
      selectedDispensaryId: 'disp-1',
    } as any);

    // No mapping in DB -> should return UNMAPPED
    vi.mocked(prisma.vendorProductMapping.findMany).mockResolvedValue([]);

    const warnings = await getCartVendorWarnings('sess-token-1', 'disp-1');
    expect(warnings).toHaveLength(1);
    expect(warnings[0].reason).toBe('UNMAPPED');
    expect(warnings[0].productId).toBe('prod-1');
  });
});

