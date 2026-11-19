import crypto from 'crypto';
import { FulfillmentType, AssignmentSource } from '@prisma/client';
import { determinePriceMode, formatMoney, resolveUnitPrice } from '../pricing';
import {
  AllocatedOrderItem,
  AllocatedSubOrder,
  AllocatorCartLine,
  AllocatorDispensaryCandidate,
  AlternativeDispensary,
  DispensarySuggestion,
  DistributionAllocationInput,
  DistributionResult,
  StoreNotEligibleError,
  UnfulfillableLine,
} from './types';

/**
 * Computes a deterministic SHA-256 hash representing the allocation state.
 * Any change in pricing, quantities, assigned stores, or unfulfillable status
 * produces a different hash, allowing detection of stale previews (409 PREVIEW_STALE).
 */
export function computePreviewHash(
  fulfillmentType: FulfillmentType,
  zip: string | null,
  subOrders: AllocatedSubOrder[],
  unfulfillable: UnfulfillableLine[],
  total: string
): string {
  const normalized = {
    fulfillmentType,
    zip: zip || '',
    total,
    subOrders: subOrders
      .map((so) => ({
        dispensaryId: so.dispensaryId,
        assignment: so.assignment,
        subtotal: so.subtotal,
        items: so.items
          .map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            lineTotal: it.lineTotal,
          }))
          .sort((a, b) => a.productId.localeCompare(b.productId)),
      }))
      .sort((a, b) => a.dispensaryId.localeCompare(b.dispensaryId)),
    unfulfillable: unfulfillable
      .map((u) => ({
        productId: u.productId,
        reason: u.reason,
      }))
      .sort((a, b) => a.productId.localeCompare(b.productId)),
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex');
}

/**
 * Finds up to 3 nearest active stores that have sufficient stock for an unfulfillable line.
 * (REQ-F-017, docs/06 §4 step 5)
 */
function findSuggestionsForLine(
  line: AllocatorCartLine,
  allStores: AllocatorDispensaryCandidate[]
): DispensarySuggestion[] {
  const matchingStores = allStores.filter((store) => {
    // Brand channel scoping: If line is restricted to a brand, store must carry that brand
    if (line.channelBrandId && !store.brandIds.includes(line.channelBrandId)) {
      return false;
    }
    // Must have stock
    const inv = store.inventories.get(line.productId);
    if (!inv || inv.stockQty < line.quantity) {
      return false;
    }
    // Must offer at least pickup or delivery
    return store.offersPickup || store.offersDelivery;
  });

  // Sort by distance (nearest first; nulls last), then by name
  matchingStores.sort((a, b) => {
    if (a.distanceMiles !== null && b.distanceMiles !== null) {
      return a.distanceMiles - b.distanceMiles;
    }
    if (a.distanceMiles !== null) return -1;
    if (b.distanceMiles !== null) return 1;
    return a.name.localeCompare(b.name);
  });

  return matchingStores.slice(0, 3).map((store) => {
    const fulfillmentTypes: FulfillmentType[] = [];
    if (store.offersPickup) fulfillmentTypes.push(FulfillmentType.PICKUP);
    if (store.offersDelivery) fulfillmentTypes.push(FulfillmentType.DELIVERY);

    return {
      dispensaryId: store.id,
      dispensaryName: store.name,
      fulfillmentTypes,
      distanceMiles: store.distanceMiles,
    };
  });
}

/**
 * Pure Multi-Dispensary Greedy Allocator
 * Specification: docs/06 §4, docs/08 §8.1, ADR-007, ADR-011, ADR-012
 */
export function allocateCart(input: DistributionAllocationInput): DistributionResult {
  const {
    lines,
    fulfillmentType,
    zip = null,
    itemOverrides = [],
    preferredDispensaryId = null,
    preferredDispensarySource = AssignmentSource.SHOPPER_CHANGED,
    candidates,
    allActiveDispensaries = candidates,
  } = input;

  if (lines.length === 0) {
    const emptyHash = computePreviewHash(fulfillmentType, zip, [], [], '0.00');
    return {
      zip,
      fulfillmentType,
      subOrders: [],
      unfulfillable: [],
      total: '0.00',
      previewHash: emptyHash,
    };
  }

  // 1. Filter candidate dispensaries for fulfillment type and coverage ZIP
  const eligibleDispensaries = candidates.filter((disp) => {
    if (fulfillmentType === FulfillmentType.DELIVERY) {
      if (!disp.offersDelivery) return false;
      if (!zip) return false;
      return disp.coverageZips.includes(zip);
    } else {
      return disp.offersPickup;
    }
  });

  // Tracking assignments: lineId -> { dispensary, assignment }
  const assignedLines = new Map<
    string,
    { dispensary: AllocatorDispensaryCandidate; assignment: AssignmentSource }
  >();

  // Tracking unfulfillable: productId -> UnfulfillableLine
  const unfulfillableMap = new Map<string, UnfulfillableLine>();

  // 2. Process itemOverrides
  // (Shopper changed store for specific lines; docs/06 §4 step 3)
  for (const override of itemOverrides) {
    const line = lines.find((l) => l.productId === override.productId);
    if (!line) continue;

    // Find the target dispensary across active stores
    const targetDisp =
      eligibleDispensaries.find((d) => d.id === override.dispensaryId) ||
      allActiveDispensaries.find((d) => d.id === override.dispensaryId);

    if (!targetDisp) {
      throw new StoreNotEligibleError(
        override.dispensaryId,
        override.productId,
        `Dispensary ${override.dispensaryId} does not exist or is inactive`
      );
    }

    // Eligibility check: Must be in eligibleDispensaries and match brand channel if applicable
    const isEligible = eligibleDispensaries.some((d) => d.id === targetDisp.id);
    const matchesBrand = line.channelBrandId
      ? targetDisp.brandIds.includes(line.channelBrandId)
      : true;

    if (!isEligible || !matchesBrand) {
      throw new StoreNotEligibleError(
        targetDisp.id,
        line.productId,
        `Dispensary ${targetDisp.name} is not eligible for ${fulfillmentType} to ZIP ${zip || 'N/A'}${
          line.channelBrandId ? ' or is not assigned to the brand channel' : ''
        }`
      );
    }

    // Stock check
    const inv = targetDisp.inventories.get(line.productId);
    if (inv && inv.stockQty >= line.quantity) {
      assignedLines.set(line.id, {
        dispensary: targetDisp,
        assignment: AssignmentSource.SHOPPER_CHANGED,
      });
    } else {
      // Out of stock at chosen store -> unfulfillable with NOT_AT_SELECTED_STORE
      unfulfillableMap.set(line.productId, {
        productId: line.productId,
        name: line.name,
        reason: 'NOT_AT_SELECTED_STORE',
        suggestions: findSuggestionsForLine(line, allActiveDispensaries),
      });
    }
  }

  // 3. Process preferredDispensaryId (shopper whole-cart choice or profile default)
  // (docs/06 §4 step 3)
  if (preferredDispensaryId) {
    const prefDisp = eligibleDispensaries.find((d) => d.id === preferredDispensaryId);
    if (prefDisp) {
      for (const line of lines) {
        if (assignedLines.has(line.id) || unfulfillableMap.has(line.productId)) {
          continue;
        }

        // Brand channel check
        if (line.channelBrandId && !prefDisp.brandIds.includes(line.channelBrandId)) {
          continue;
        }

        // Stock check
        const inv = prefDisp.inventories.get(line.productId);
        if (inv && inv.stockQty >= line.quantity) {
          assignedLines.set(line.id, {
            dispensary: prefDisp,
            assignment: preferredDispensarySource,
          });
        }
      }
    }
  }

  // 4. Greedy "Most Items" Loop for Remaining Lines
  // (docs/06 §4 step 4)
  let remainingLines = lines.filter(
    (l) => !assignedLines.has(l.id) && !unfulfillableMap.has(l.productId)
  );

  // Available stores for greedy rounds
  const availableStores = [...eligibleDispensaries];

  while (remainingLines.length > 0 && availableStores.length > 0) {
    // Score each store by how many unassigned items it has in stock
    const storeCandidates = availableStores.map((store) => {
      const fulfillableLines = remainingLines.filter((line) => {
        if (line.channelBrandId && !store.brandIds.includes(line.channelBrandId)) {
          return false;
        }
        const inv = store.inventories.get(line.productId);
        return inv && inv.stockQty >= line.quantity;
      });

      // Compute subtotal for tie-breaks
      let subtotal = 0;
      for (const line of fulfillableLines) {
        const inv = store.inventories.get(line.productId);
        const unitPrice = resolveUnitPrice(
          { owtletPrice: line.owtletPrice },
          inv ? { price: inv.price } : null
        );
        subtotal += Number(unitPrice) * line.quantity;
      }

      return {
        store,
        fulfillableLines,
        count: fulfillableLines.length,
        subtotal,
      };
    });

    // Keep only stores that can supply at least 1 item
    const viable = storeCandidates.filter((c) => c.count > 0);
    if (viable.length === 0) {
      break;
    }

    // Deterministic tie-breaks:
    // 1) Most items (count DESC)
    // 2) Lowest subtotal (subtotal ASC)
    // 3) Nearest distance (distanceMiles ASC, nulls last)
    // 4) Preferred store hint (preferredDispensaryId or line.preferredDispensaryId)
    // 5) Deterministic string comparison (name ASC, id ASC)
    viable.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      if (Math.abs(a.subtotal - b.subtotal) > 0.001) {
        return a.subtotal - b.subtotal;
      }
      if (a.store.distanceMiles !== null && b.store.distanceMiles !== null) {
        if (Math.abs(a.store.distanceMiles - b.store.distanceMiles) > 0.001) {
          return a.store.distanceMiles - b.store.distanceMiles;
        }
      } else if (a.store.distanceMiles !== null) {
        return -1;
      } else if (b.store.distanceMiles !== null) {
        return 1;
      }

      // Preferred store hint
      const aIsPref = a.store.id === preferredDispensaryId;
      const bIsPref = b.store.id === preferredDispensaryId;
      if (aIsPref && !bIsPref) return -1;
      if (!aIsPref && bIsPref) return 1;

      const nameCmp = a.store.name.localeCompare(b.store.name);
      if (nameCmp !== 0) return nameCmp;
      return a.store.id.localeCompare(b.store.id);
    });

    const winner = viable[0];

    // Assign all items supplied by this winning store
    for (const line of winner.fulfillableLines) {
      assignedLines.set(line.id, {
        dispensary: winner.store,
        assignment: AssignmentSource.AUTO,
      });
    }

    // Remove winning store from greedy pool so remaining items go to next best store
    const storeIdx = availableStores.findIndex((s) => s.id === winner.store.id);
    if (storeIdx !== -1) {
      availableStores.splice(storeIdx, 1);
    }

    remainingLines = remainingLines.filter((l) => !assignedLines.has(l.id));
  }

  // 5. Lines that no eligible store could fulfill become unfulfillable
  // (docs/06 §4 step 5)
  for (const line of remainingLines) {
    unfulfillableMap.set(line.productId, {
      productId: line.productId,
      name: line.name,
      reason: eligibleDispensaries.length === 0 ? 'NO_ELIGIBLE_STORES' : 'NOT_IN_STOCK_FOR_ZIP',
      suggestions: findSuggestionsForLine(line, allActiveDispensaries),
    });
  }

  // 6. Group assigned lines into SubOrders
  const subOrderMap = new Map<
    string,
    {
      dispensary: AllocatorDispensaryCandidate;
      assignment: AssignmentSource;
      lines: AllocatorCartLine[];
    }
  >();

  for (const line of lines) {
    const assignmentInfo = assignedLines.get(line.id);
    if (!assignmentInfo) continue;

    const existing = subOrderMap.get(assignmentInfo.dispensary.id);
    if (existing) {
      existing.lines.push(line);
      // Elevate assignment status if changed by shopper
      if (assignmentInfo.assignment === AssignmentSource.SHOPPER_CHANGED) {
        existing.assignment = AssignmentSource.SHOPPER_CHANGED;
      } else if (
        assignmentInfo.assignment === AssignmentSource.PROFILE_DEFAULT &&
        existing.assignment === AssignmentSource.AUTO
      ) {
        existing.assignment = AssignmentSource.PROFILE_DEFAULT;
      }
    } else {
      subOrderMap.set(assignmentInfo.dispensary.id, {
        dispensary: assignmentInfo.dispensary,
        assignment: assignmentInfo.assignment,
        lines: [line],
      });
    }
  }

  // 7. Build SubOrders with items, subtotals, and alternatives
  const subOrders: AllocatedSubOrder[] = [];
  let totalNum = 0;

  for (const group of subOrderMap.values()) {
    const disp = group.dispensary;
    let subtotalNum = 0;

    const items: AllocatedOrderItem[] = group.lines.map((line) => {
      const inv = disp.inventories.get(line.productId);
      const unitPrice = resolveUnitPrice(
        { owtletPrice: line.owtletPrice },
        inv ? { price: inv.price } : null
      );
      const priceMode = determinePriceMode({ owtletPrice: line.owtletPrice });
      const lineTotalNum = Number(unitPrice) * line.quantity;
      subtotalNum += lineTotalNum;

      return {
        productId: line.productId,
        name: line.name,
        quantity: line.quantity,
        unitPrice,
        priceMode,
        lineTotal: formatMoney(lineTotalNum),
      };
    });

    totalNum += subtotalNum;

    // Check if all lines share the same channel brand
    const distinctBrandIds = Array.from(
      new Set(group.lines.map((l) => l.channelBrandId).filter(Boolean))
    );
    const uniformBrandId = distinctBrandIds.length === 1 ? distinctBrandIds[0]! : null;

    // Alternatives: other eligible dispensaries that could supply these items (REQ-F-013)
    const otherEligible = eligibleDispensaries.filter((d) => d.id !== disp.id);
    const alternatives: AlternativeDispensary[] = otherEligible
      .filter((altDisp) => {
        // If items are brand-specific, alternative must carry that brand
        if (uniformBrandId && !altDisp.brandIds.includes(uniformBrandId)) {
          return false;
        }
        return true;
      })
      .map((altDisp) => {
        const missingProductIds: string[] = [];
        for (const line of group.lines) {
          const inv = altDisp.inventories.get(line.productId);
          if (!inv || inv.stockQty < line.quantity) {
            missingProductIds.push(line.productId);
          }
        }

        return {
          dispensaryId: altDisp.id,
          dispensaryName: altDisp.name,
          canSupplyAll: missingProductIds.length === 0,
          missingProductIds,
          distanceMiles: altDisp.distanceMiles,
          isOpenNow: altDisp.isOpenNow,
        };
      });

    // Sort alternatives: canSupplyAll first, then fewest missing items, then nearest distance
    alternatives.sort((a, b) => {
      if (a.canSupplyAll && !b.canSupplyAll) return -1;
      if (!a.canSupplyAll && b.canSupplyAll) return 1;
      if (a.missingProductIds.length !== b.missingProductIds.length) {
        return a.missingProductIds.length - b.missingProductIds.length;
      }
      if (a.distanceMiles !== null && b.distanceMiles !== null) {
        return a.distanceMiles - b.distanceMiles;
      }
      return a.dispensaryName.localeCompare(b.dispensaryName);
    });

    subOrders.push({
      dispensaryId: disp.id,
      dispensaryName: disp.name,
      fulfillmentType,
      assignment: group.assignment,
      channelBrandId: uniformBrandId,
      channelBrand: null, // hydrated by caller if needed
      isOpenNow: disp.isOpenNow,
      hoursToday: disp.hoursToday,
      isDeliveringNow: disp.isDeliveringNow,
      deliveryHoursToday: disp.deliveryHoursToday,
      distanceMiles: disp.distanceMiles,
      items,
      subtotal: formatMoney(subtotalNum),
      handoffChannel: disp.handoffChannel,
      alternatives,
    });
  }

  // Sort sub-orders so the store with the most items leads (ADR-007, REQ-F-007)
  subOrders.sort((a, b) => {
    if (b.items.length !== a.items.length) {
      return b.items.length - a.items.length;
    }
    const subtotalDiff = Number(a.subtotal) - Number(b.subtotal);
    if (Math.abs(subtotalDiff) > 0.001) {
      return subtotalDiff;
    }
    if (a.distanceMiles !== null && b.distanceMiles !== null) {
      return a.distanceMiles - b.distanceMiles;
    }
    return a.dispensaryName.localeCompare(b.dispensaryName);
  });

  const unfulfillable = Array.from(unfulfillableMap.values());
  const formattedTotal = formatMoney(totalNum);
  const previewHash = computePreviewHash(
    fulfillmentType,
    zip,
    subOrders,
    unfulfillable,
    formattedTotal
  );

  return {
    zip,
    fulfillmentType,
    subOrders,
    unfulfillable,
    total: formattedTotal,
    previewHash,
  };
}

