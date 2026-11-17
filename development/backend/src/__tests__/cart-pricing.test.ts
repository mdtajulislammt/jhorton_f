import { describe, it, expect, vi } from 'vitest';

vi.mock('@/server/db', () => ({ prisma: {} }));

import { formatCartDto, type CartWithRelations } from '@/server/cart';

const NOW = new Date('2026-11-16T18:00:00Z');

function inv(dispensaryId: string, price: string, stockQty: number, isActive = true) {
  return { dispensaryId, price, stockQty, dispensary: { isActive } };
}

function cartWith(item: {
  owtletPrice?: string | null;
  inventory: ReturnType<typeof inv>[];
  preferredDispensaryId?: string | null;
  quantity?: number;
}): CartWithRelations {
  return {
    id: 'cart-1',
    sessionToken: 'sess-1',
    status: 'ACTIVE',
    lastActivityAt: NOW,
    liveShowId: null,
    liveShow: null,
    items: [
      {
        id: 'line-1',
        quantity: item.quantity ?? 1,
        source: 'catalog',
        preferredDispensaryId: item.preferredDispensaryId ?? null,
        channelBrand: null,
        product: {
          id: 'prod-1',
          slug: 'og-kush-live-badder-1g',
          name: 'Live Badder Concentrate 1.0g',
          imageUrls: [],
          owtletPrice: item.owtletPrice ?? null,
          strain: { name: 'OG Kush', type: 'INDICA' },
          category: { name: 'Concentrates', slug: 'concentrates' },
          brand: null,
          inventory: item.inventory,
        },
      },
    ],
  } as unknown as CartWithRelations;
}

describe('formatCartDto per-store pricing (TASK-023, REQ-F-015)', () => {
  it('prices a PER_STORE line with no preferred store at the lowest in-stock active price, not $0.00', () => {
    const dto = formatCartDto(
      cartWith({ inventory: [inv('a', '62.00', 5), inv('b', '58.00', 3)], quantity: 2 }),
      NOW
    );
    const line = dto.items[0];
    expect(line.priceMode).toBe('PER_STORE');
    expect(line.unitPrice).toBe('58.00');
    expect(line.fromPrice).toBe('58.00');
    expect(line.lineTotal).toBe('116.00');
    expect(dto.estimatedSubtotal).toBe('116.00');
  });

  it('ignores inactive dispensaries, matching the catalog "From" price', () => {
    const dto = formatCartDto(
      cartWith({ inventory: [inv('closed', '40.00', 9, false), inv('open', '60.00', 2)] }),
      NOW
    );
    expect(dto.items[0].unitPrice).toBe('60.00');
  });

  it('uses the preferred store price when one is set', () => {
    const dto = formatCartDto(
      cartWith({ inventory: [inv('a', '62.00', 5), inv('b', '58.00', 3)], preferredDispensaryId: 'a' }),
      NOW
    );
    expect(dto.items[0].unitPrice).toBe('62.00');
    expect(dto.items[0].fromPrice).toBe('58.00');
  });

  it('keeps the uniform Owtlet price for show products', () => {
    const dto = formatCartDto(
      cartWith({ owtletPrice: '50.00', inventory: [inv('a', '62.00', 5)], preferredDispensaryId: 'a' }),
      NOW
    );
    expect(dto.items[0].priceMode).toBe('OWTLET');
    expect(dto.items[0].unitPrice).toBe('50.00');
  });
});
