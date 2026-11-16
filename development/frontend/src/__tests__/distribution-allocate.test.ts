import { describe, it, expect } from 'vitest';
import { FulfillmentType, AssignmentSource, HandoffChannel } from '@prisma/client';
import {
  allocateCart,
  computePreviewHash,
} from '@/server/distribution/allocate';
import {
  AllocatorCartLine,
  AllocatorDispensaryCandidate,
  AllocatorInventoryItem,
  StoreNotEligibleError,
} from '@/server/distribution/types';

describe('Distribution Allocator (docs/06 §4, ADR-007, ADR-011, ADR-012, T-DST-01..04, T-FUL-01, T-BRD-01, T-SEL-01, T-OOS-01, T-PRC-01)', () => {
  const storeA: AllocatorDispensaryCandidate = {
    id: 'disp-a',
    name: 'Gotham Greenery',
    slug: 'gotham-greenery',
    offersPickup: true,
    offersDelivery: true,
    coverageZips: ['10001', '10002', '11201'],
    isOpenNow: true,
    hoursToday: { opensAt: '10:00', closesAt: '22:00' },
    isDeliveringNow: true,
    deliveryHoursToday: { opensAt: '11:00', closesAt: '21:00' },
    distanceMiles: 2.1,
    handoffChannel: HandoffChannel.LEAFLY,
    brandIds: ['brand-1', 'brand-2'],
    inventories: new Map<string, AllocatorInventoryItem>([
      { productId: 'prod-1', dispensaryId: 'disp-a', stockQty: 10, price: 40 },
      { productId: 'prod-2', dispensaryId: 'disp-a', stockQty: 5, price: 50 },
    ].map((i) => [i.productId, i])),
  };

  const storeB: AllocatorDispensaryCandidate = {
    id: 'disp-b',
    name: 'Kings County Cannabis',
    slug: 'kings-county',
    offersPickup: true,
    offersDelivery: false, // Pickup only!
    coverageZips: [],
    isOpenNow: true,
    hoursToday: { opensAt: '09:00', closesAt: '21:00' },
    isDeliveringNow: false,
    deliveryHoursToday: null,
    distanceMiles: 4.5,
    handoffChannel: HandoffChannel.RETAILER_PAGE,
    brandIds: ['brand-1'],
    inventories: new Map<string, AllocatorInventoryItem>([
      { productId: 'prod-2', dispensaryId: 'disp-b', stockQty: 10, price: 48 },
      { productId: 'prod-3', dispensaryId: 'disp-b', stockQty: 15, price: 60 },
    ].map((i) => [i.productId, i])),
  };

  const storeC: AllocatorDispensaryCandidate = {
    id: 'disp-c',
    name: 'Empire Express',
    slug: 'empire-express',
    offersPickup: false, // Delivery only!
    offersDelivery: true,
    coverageZips: ['11201', '11215'],
    isOpenNow: false, // Closed now, but stays eligible! (REQ-F-008/018)
    hoursToday: { opensAt: '12:00', closesAt: '20:00' },
    isDeliveringNow: false,
    deliveryHoursToday: { opensAt: '12:00', closesAt: '20:00' },
    distanceMiles: 3.2,
    handoffChannel: HandoffChannel.RETAILER_PAGE,
    brandIds: ['brand-2'],
    inventories: new Map<string, AllocatorInventoryItem>([
      { productId: 'prod-1', dispensaryId: 'disp-c', stockQty: 2, price: 42 },
      { productId: 'prod-3', dispensaryId: 'disp-c', stockQty: 8, price: 55 },
    ].map((i) => [i.productId, i])),
  };

  const allStores = [storeA, storeB, storeC];

  describe('T-DST-01: Greedy Most-Items Selection & Split Allocation', () => {
    it('selects the dispensary carrying the most items first, then splits remaining to next best store', () => {
      // Cart has prod-1, prod-2, and prod-3 for DELIVERY to 11201
      // Eligible for delivery to 11201: storeA (has prod-1, prod-2) and storeC (has prod-1, prod-3)
      // storeA has 2 items (prod-1, prod-2); storeC has 2 items (prod-1, prod-3)
      // Since tie in count (2 vs 2), tie-break checks subtotal:
      // storeA subtotal: prod-1 ($40) + prod-2 ($50) = $90
      // storeC subtotal: prod-1 ($42) + prod-3 ($55) = $97 -> storeA wins round 1!
      // storeA fulfills prod-1 and prod-2.
      // Remaining item: prod-3. storeC fulfills prod-3.
      const lines: AllocatorCartLine[] = [
        { id: 'l1', productId: 'prod-1', name: 'Blue Dream', quantity: 1, owtletPrice: null },
        { id: 'l2', productId: 'prod-2', name: 'Sour Diesel', quantity: 1, owtletPrice: null },
        { id: 'l3', productId: 'prod-3', name: 'OG Kush', quantity: 1, owtletPrice: null },
      ];

      const result = allocateCart({
        lines,
        fulfillmentType: FulfillmentType.DELIVERY,
        zip: '11201',
        candidates: allStores,
        allActiveDispensaries: allStores,
      });

      expect(result.subOrders).toHaveLength(2);
      expect(result.unfulfillable).toHaveLength(0);

      // Lead subOrder has the most items (2 items from Store A)
      const leadSubOrder = result.subOrders[0];
      expect(leadSubOrder.dispensaryId).toBe('disp-a');
      expect(leadSubOrder.items).toHaveLength(2);
      expect(leadSubOrder.items.map((i) => i.productId)).toEqual(['prod-1', 'prod-2']);
      expect(leadSubOrder.assignment).toBe(AssignmentSource.AUTO);

      // Second subOrder has remaining item from Store C
      const secondSubOrder = result.subOrders[1];
      expect(secondSubOrder.dispensaryId).toBe('disp-c');
      expect(secondSubOrder.items).toHaveLength(1);
      expect(secondSubOrder.items[0].productId).toBe('prod-3');

      // Total is $40 + $50 + $55 = $145.00
      expect(result.total).toBe('145.00');
    });

    it('never splits a single line across multiple stores', () => {
      // Cart has quantity 4 of prod-1.
      // Store A has stock 10. Store C has stock 2.
      // Store C cannot supply 4 (stock 2 < 4), so Store A must take all 4.
      const lines: AllocatorCartLine[] = [
        { id: 'l1', productId: 'prod-1', name: 'Blue Dream', quantity: 4, owtletPrice: 40 },
      ];

      const result = allocateCart({
        lines,
        fulfillmentType: FulfillmentType.DELIVERY,
        zip: '11201',
        candidates: allStores,
      });

      expect(result.subOrders).toHaveLength(1);
      expect(result.subOrders[0].dispensaryId).toBe('disp-a');
      expect(result.subOrders[0].items[0].quantity).toBe(4);
    });
  });

  describe('T-DST-02: Deterministic Tie-Breaks', () => {
    it('breaks count ties by lowest subtotal, then nearest distance', () => {
      // Create two stores with identical inventory but different prices and distances
      const storeX: AllocatorDispensaryCandidate = {
        ...storeA,
        id: 'disp-x',
        name: 'Store X',
        distanceMiles: 5.0,
        inventories: new Map([
          ['prod-1', { productId: 'prod-1', dispensaryId: 'disp-x', stockQty: 10, price: 35 }],
        ]),
      };

      const storeY: AllocatorDispensaryCandidate = {
        ...storeA,
        id: 'disp-y',
        name: 'Store Y',
        distanceMiles: 1.0,
        inventories: new Map([
          ['prod-1', { productId: 'prod-1', dispensaryId: 'disp-y', stockQty: 10, price: 45 }],
        ]),
      };

      const lines: AllocatorCartLine[] = [
        { id: 'l1', productId: 'prod-1', name: 'Blue Dream', quantity: 1, owtletPrice: null },
      ];

      // Both supply 1 item. Store X has lower subtotal ($35 vs $45) -> Store X wins
      const result = allocateCart({
        lines,
        fulfillmentType: FulfillmentType.DELIVERY,
        zip: '11201',
        candidates: [storeY, storeX],
      });

      expect(result.subOrders[0].dispensaryId).toBe('disp-x');
    });

    it('breaks subtotal ties by nearest distance', () => {
      const storeX: AllocatorDispensaryCandidate = {
        ...storeA,
        id: 'disp-x',
        name: 'Store Far',
        distanceMiles: 8.0,
        inventories: new Map([
          ['prod-1', { productId: 'prod-1', dispensaryId: 'disp-x', stockQty: 10, price: 40 }],
        ]),
      };

      const storeY: AllocatorDispensaryCandidate = {
        ...storeA,
        id: 'disp-y',
        name: 'Store Near',
        distanceMiles: 1.5,
        inventories: new Map([
          ['prod-1', { productId: 'prod-1', dispensaryId: 'disp-y', stockQty: 10, price: 40 }],
        ]),
      };

      const lines: AllocatorCartLine[] = [
        { id: 'l1', productId: 'prod-1', name: 'Blue Dream', quantity: 1, owtletPrice: null },
      ];

      const result = allocateCart({
        lines,
        fulfillmentType: FulfillmentType.DELIVERY,
        zip: '11201',
        candidates: [storeX, storeY],
      });

      expect(result.subOrders[0].dispensaryId).toBe('disp-y');
    });
  });

  describe('T-DST-03 & T-FUL-01: Fulfillment Eligibility & ZIP Coverage', () => {
    it('excludes stores that do not deliver to the ZIP for DELIVERY', () => {
      // Store A covers 10001, 10002, 11201. Store C covers 11201, 11215. Store B does not deliver.
      // Order to ZIP 10001: Store C does not cover 10001, Store B does not deliver. Only Store A is eligible.
      const lines: AllocatorCartLine[] = [
        { id: 'l3', productId: 'prod-3', name: 'OG Kush', quantity: 1, owtletPrice: null },
      ];

      // prod-3 is only stocked by Store B and Store C. Store A does not have it.
      // Therefore, for delivery to 10001, prod-3 is unfulfillable!
      const result = allocateCart({
        lines,
        fulfillmentType: FulfillmentType.DELIVERY,
        zip: '10001',
        candidates: allStores,
        allActiveDispensaries: allStores,
      });

      expect(result.subOrders).toHaveLength(0);
      expect(result.unfulfillable).toHaveLength(1);
      expect(result.unfulfillable[0].productId).toBe('prod-3');
    });

    it('allows pickup-only stores for PICKUP fulfillment regardless of delivery coverage', () => {
      // Store B is pickup-only (offersDelivery: false).
      // With uniform owtletPrice, subtotal is identical, so nearest distance (Store A @ 2.1 mi vs Store B @ 4.5 mi) wins.
      const lines: AllocatorCartLine[] = [
        { id: 'l2', productId: 'prod-2', name: 'Sour Diesel', quantity: 1, owtletPrice: 48 },
      ];

      const result = allocateCart({
        lines,
        fulfillmentType: FulfillmentType.PICKUP,
        zip: '11201',
        candidates: allStores,
      });

      expect(result.subOrders).toHaveLength(1);
      expect(result.subOrders[0].dispensaryId).toBe('disp-a');

      // Now if shopper explicitly overrides to Store B (pickup only), it succeeds because Store B offers pickup
      const pickupOverrideResult = allocateCart({
        lines,
        fulfillmentType: FulfillmentType.PICKUP,
        zip: '11201',
        itemOverrides: [{ productId: 'prod-2', dispensaryId: 'disp-b' }],
        candidates: allStores,
      });

      expect(pickupOverrideResult.subOrders[0].dispensaryId).toBe('disp-b');
      expect(pickupOverrideResult.subOrders[0].assignment).toBe(AssignmentSource.SHOPPER_CHANGED);
    });
  });

  describe('T-BRD-01: Brand Channel Scoping', () => {
    it('restricts brand channel lines to partner stores assigned to that brand', () => {
      // prod-1 is brand-2. Store C is assigned to brand-2. Store B is assigned to brand-1 only.
      // Line with channelBrandId: 'brand-2' can only go to storeA (brand-1, brand-2) or storeC (brand-2).
      const lines: AllocatorCartLine[] = [
        {
          id: 'l1',
          productId: 'prod-1',
          name: 'Brand 2 Flower',
          quantity: 1,
          channelBrandId: 'brand-2',
        },
      ];

      const result = allocateCart({
        lines,
        fulfillmentType: FulfillmentType.DELIVERY,
        zip: '11201',
        candidates: allStores,
      });

      expect(result.subOrders).toHaveLength(1);
      expect(['disp-a', 'disp-c']).toContain(result.subOrders[0].dispensaryId);
    });

    it('limits out-of-stock suggestions to brand partner stores when line is restricted to a brand (AC-BRD-02)', () => {
      // prod-3 has quantity 50 (exceeds all stock: storeB has 15, storeC has 8).
      // If channelBrandId is 'brand-2', suggestions should only consider storeA and storeC (brand-2 partners),
      // and NOT storeB (brand-1 partner only).
      const lines: AllocatorCartLine[] = [
        {
          id: 'l-oos',
          productId: 'prod-3',
          name: 'Rare Brand-2 Flower',
          quantity: 50, // exceeds available stock
          channelBrandId: 'brand-2',
        },
      ];

      const result = allocateCart({
        lines,
        fulfillmentType: FulfillmentType.PICKUP,
        zip: '11201',
        candidates: allStores,
      });

      expect(result.unfulfillable).toHaveLength(1);
      const unfulfillableLine = result.unfulfillable[0];
      expect(unfulfillableLine.productId).toBe('prod-3');
      // All suggestions must carry brand-2
      for (const suggestion of unfulfillableLine.suggestions) {
        expect(['disp-a', 'disp-c']).toContain(suggestion.dispensaryId);
        expect(suggestion.dispensaryId).not.toBe('disp-b');
      }
    });
  });

  describe('T-SEL-01: Store Overrides & Preferred Dispensary', () => {
    it('honors shopper itemOverrides and marks assignment as SHOPPER_CHANGED', () => {
      const lines: AllocatorCartLine[] = [
        { id: 'l1', productId: 'prod-1', name: 'Blue Dream', quantity: 1, owtletPrice: 40 },
      ];

      // Normally storeA would win by distance, but shopper overrides to storeC
      const result = allocateCart({
        lines,
        fulfillmentType: FulfillmentType.DELIVERY,
        zip: '11201',
        itemOverrides: [{ productId: 'prod-1', dispensaryId: 'disp-c' }],
        candidates: allStores,
      });

      expect(result.subOrders[0].dispensaryId).toBe('disp-c');
      expect(result.subOrders[0].assignment).toBe(AssignmentSource.SHOPPER_CHANGED);
    });

    it('throws StoreNotEligibleError (422) if override store is not eligible for delivery/ZIP', () => {
      const lines: AllocatorCartLine[] = [
        { id: 'l1', productId: 'prod-1', name: 'Blue Dream', quantity: 1 },
      ];

      // Store B does not offer delivery
      expect(() =>
        allocateCart({
          lines,
          fulfillmentType: FulfillmentType.DELIVERY,
          zip: '11201',
          itemOverrides: [{ productId: 'prod-1', dispensaryId: 'disp-b' }],
          candidates: allStores,
        })
      ).toThrow(StoreNotEligibleError);
    });

    it('marks line unfulfillable with NOT_AT_SELECTED_STORE if override store has no stock', () => {
      const lines: AllocatorCartLine[] = [
        { id: 'l2', productId: 'prod-2', name: 'Sour Diesel', quantity: 1 },
      ];

      // Store C is eligible for delivery to 11201, but does NOT carry prod-2
      const result = allocateCart({
        lines,
        fulfillmentType: FulfillmentType.DELIVERY,
        zip: '11201',
        itemOverrides: [{ productId: 'prod-2', dispensaryId: 'disp-c' }],
        candidates: allStores,
        allActiveDispensaries: allStores,
      });

      expect(result.subOrders).toHaveLength(0);
      expect(result.unfulfillable).toHaveLength(1);
      expect(result.unfulfillable[0].reason).toBe('NOT_AT_SELECTED_STORE');
      // Suggestions should recommend Store A (which has prod-2 in stock)
      expect(result.unfulfillable[0].suggestions[0].dispensaryId).toBe('disp-a');
    });

    it('assigns remaining lines to preferredDispensaryId when eligible and in stock', () => {
      const lines: AllocatorCartLine[] = [
        { id: 'l1', productId: 'prod-1', name: 'Blue Dream', quantity: 1 },
        { id: 'l3', productId: 'prod-3', name: 'OG Kush', quantity: 1 },
      ];

      // Set preferredDispensaryId to storeC with PROFILE_DEFAULT
      const result = allocateCart({
        lines,
        fulfillmentType: FulfillmentType.DELIVERY,
        zip: '11201',
        preferredDispensaryId: 'disp-c',
        preferredDispensarySource: AssignmentSource.PROFILE_DEFAULT,
        candidates: allStores,
      });

      // Store C has prod-1 and prod-3, so it gets both
      expect(result.subOrders).toHaveLength(1);
      expect(result.subOrders[0].dispensaryId).toBe('disp-c');
      expect(result.subOrders[0].assignment).toBe(AssignmentSource.PROFILE_DEFAULT);
    });
  });

  describe('T-OOS-01: Suggestions for Unfulfillable Items', () => {
    it('returns up to 3 nearest active stores that have stock for unfulfillable items', () => {
      const lines: AllocatorCartLine[] = [
        { id: 'l-rare', productId: 'prod-rare', name: 'Rare Rosin', quantity: 1 },
      ];

      // Store B has prod-rare in stock (pickup only)
      const storeWithRare: AllocatorDispensaryCandidate = {
        ...storeB,
        inventories: new Map([
          ['prod-rare', { productId: 'prod-rare', dispensaryId: 'disp-b', stockQty: 5, price: 70 }],
        ]),
      };

      const result = allocateCart({
        lines,
        fulfillmentType: FulfillmentType.DELIVERY,
        zip: '11201',
        candidates: [storeA, storeC], // neither has prod-rare
        allActiveDispensaries: [storeA, storeC, storeWithRare],
      });

      expect(result.unfulfillable).toHaveLength(1);
      expect(result.unfulfillable[0].reason).toBe('NOT_IN_STOCK_FOR_ZIP');
      expect(result.unfulfillable[0].suggestions).toHaveLength(1);
      expect(result.unfulfillable[0].suggestions[0].dispensaryId).toBe('disp-b');
      expect(result.unfulfillable[0].suggestions[0].fulfillmentTypes).toContain(FulfillmentType.PICKUP);
    });
  });

  describe('T-PRC-01: Owtlet Price Uniformity (ADR-011, REQ-F-015)', () => {
    it('uses owtletPrice uniformly regardless of dispensary retail inventory price', () => {
      const lines: AllocatorCartLine[] = [
        { id: 'l1', productId: 'prod-1', name: 'Show Product', quantity: 2, owtletPrice: 35.0 },
      ];

      // Store A inventory price is $40, but owtletPrice is $35
      const result = allocateCart({
        lines,
        fulfillmentType: FulfillmentType.DELIVERY,
        zip: '11201',
        candidates: allStores,
      });

      expect(result.subOrders[0].items[0].unitPrice).toBe('35.00');
      expect(result.subOrders[0].items[0].priceMode).toBe('OWTLET');
      expect(result.subOrders[0].items[0].lineTotal).toBe('70.00');
      expect(result.total).toBe('70.00');
    });
  });

  describe('Alternatives & Operational Hours (REQ-F-008, REQ-F-013, REQ-F-018)', () => {
    it('includes other eligible stores in alternatives with canSupplyAll and missingProductIds', () => {
      const lines: AllocatorCartLine[] = [
        { id: 'l1', productId: 'prod-1', name: 'Blue Dream', quantity: 1, owtletPrice: 40 },
      ];

      // Both Store A and Store C cover 11201 for delivery and both have prod-1
      const result = allocateCart({
        lines,
        fulfillmentType: FulfillmentType.DELIVERY,
        zip: '11201',
        candidates: allStores,
      });

      expect(result.subOrders[0].dispensaryId).toBe('disp-a');
      expect(result.subOrders[0].alternatives).toHaveLength(1);
      const alt = result.subOrders[0].alternatives[0];
      expect(alt.dispensaryId).toBe('disp-c');
      expect(alt.canSupplyAll).toBe(true);
      expect(alt.missingProductIds).toEqual([]);
    });

    it('keeps closed stores eligible and presents their hours and status', () => {
      // Store C has isOpenNow: false
      const lines: AllocatorCartLine[] = [
        { id: 'l3', productId: 'prod-3', name: 'OG Kush', quantity: 1, owtletPrice: null },
      ];

      const result = allocateCart({
        lines,
        fulfillmentType: FulfillmentType.DELIVERY,
        zip: '11201',
        candidates: [storeC],
      });

      expect(result.subOrders[0].dispensaryId).toBe('disp-c');
      expect(result.subOrders[0].isOpenNow).toBe(false);
      expect(result.subOrders[0].hoursToday?.opensAt).toBe('12:00');
    });
  });

  describe('Preview Hash Determinism', () => {
    it('produces identical previewHash for identical allocation states', () => {
      const lines: AllocatorCartLine[] = [
        { id: 'l1', productId: 'prod-1', name: 'Blue Dream', quantity: 1, owtletPrice: 40 },
      ];

      const res1 = allocateCart({
        lines,
        fulfillmentType: FulfillmentType.DELIVERY,
        zip: '11201',
        candidates: allStores,
      });

      const res2 = allocateCart({
        lines,
        fulfillmentType: FulfillmentType.DELIVERY,
        zip: '11201',
        candidates: allStores,
      });

      expect(res1.previewHash).toBe(res2.previewHash);
    });

    it('changes previewHash if quantity, price, or unfulfillable status changes', () => {
      const lines1: AllocatorCartLine[] = [
        { id: 'l1', productId: 'prod-1', name: 'Blue Dream', quantity: 1, owtletPrice: 40 },
      ];
      const lines2: AllocatorCartLine[] = [
        { id: 'l1', productId: 'prod-1', name: 'Blue Dream', quantity: 2, owtletPrice: 40 },
      ];

      const res1 = allocateCart({
        lines: lines1,
        fulfillmentType: FulfillmentType.DELIVERY,
        zip: '11201',
        candidates: allStores,
      });

      const res2 = allocateCart({
        lines: lines2,
        fulfillmentType: FulfillmentType.DELIVERY,
        zip: '11201',
        candidates: allStores,
      });

      expect(res1.previewHash).not.toBe(res2.previewHash);
    });
  });
});
