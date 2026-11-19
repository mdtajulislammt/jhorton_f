import { FulfillmentType, AssignmentSource, HandoffChannel } from '@prisma/client';
import { PriceMode } from '../pricing';
import { HoursWindowDto } from '../dispensaries/types';

export interface AllocatorCartLine {
  id: string; // CartItem id or unique line key
  productId: string;
  name: string;
  quantity: number;
  channelBrandId?: string | null;
  preferredDispensaryId?: string | null;
  owtletPrice?: string | number | null;
}

export interface AllocatorInventoryItem {
  productId: string;
  dispensaryId: string;
  stockQty: number;
  price?: string | number | null;
}

export interface AllocatorDispensaryCandidate {
  id: string;
  name: string;
  slug: string;
  offersPickup: boolean;
  offersDelivery: boolean;
  coverageZips: string[];
  isOpenNow: boolean;
  hoursToday: HoursWindowDto | null;
  isDeliveringNow: boolean;
  deliveryHoursToday: HoursWindowDto | null;
  distanceMiles: number | null;
  handoffChannel: HandoffChannel;
  brandIds: string[];
  inventories: Map<string, AllocatorInventoryItem>;
}

export interface ItemOverride {
  productId: string;
  dispensaryId: string;
}

export interface DistributionAllocationInput {
  lines: AllocatorCartLine[];
  fulfillmentType: FulfillmentType;
  zip?: string | null;
  itemOverrides?: ItemOverride[];
  preferredDispensaryId?: string | null;
  preferredDispensarySource?: AssignmentSource;
  now?: Date;
  candidates: AllocatorDispensaryCandidate[];
  allActiveDispensaries?: AllocatorDispensaryCandidate[];
}

export interface AllocatedOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: string;
  priceMode: PriceMode;
  lineTotal: string;
}

export interface AlternativeDispensary {
  dispensaryId: string;
  dispensaryName: string;
  canSupplyAll: boolean;
  missingProductIds: string[];
  distanceMiles: number | null;
  isOpenNow: boolean;
}

export interface AllocatedSubOrder {
  dispensaryId: string;
  dispensaryName: string;
  fulfillmentType: FulfillmentType;
  assignment: AssignmentSource;
  channelBrandId: string | null;
  channelBrand: {
    id: string;
    name: string;
    slug: string;
  } | null;
  isOpenNow: boolean;
  hoursToday: HoursWindowDto | null;
  isDeliveringNow: boolean;
  deliveryHoursToday: HoursWindowDto | null;
  distanceMiles: number | null;
  items: AllocatedOrderItem[];
  subtotal: string;
  handoffChannel: HandoffChannel;
  alternatives: AlternativeDispensary[];
}

export interface DispensarySuggestion {
  dispensaryId: string;
  dispensaryName: string;
  fulfillmentTypes: FulfillmentType[];
  distanceMiles: number | null;
}

export interface UnfulfillableLine {
  productId: string;
  name: string;
  reason: 'NOT_IN_STOCK_FOR_ZIP' | 'NOT_AT_SELECTED_STORE' | 'NO_ELIGIBLE_STORES';
  suggestions: DispensarySuggestion[];
}

export interface DistributionResult {
  zip: string | null;
  fulfillmentType: FulfillmentType;
  subOrders: AllocatedSubOrder[];
  unfulfillable: UnfulfillableLine[];
  total: string;
  previewHash: string;
}

export class StoreNotEligibleError extends Error {
  readonly code = 'STORE_NOT_ELIGIBLE';
  readonly dispensaryId: string;
  readonly productId: string;

  constructor(dispensaryId: string, productId: string, reason?: string) {
    super(
      reason ||
        `Dispensary ${dispensaryId} is not eligible for this delivery address or brand channel`
    );
    this.name = 'StoreNotEligibleError';
    this.dispensaryId = dispensaryId;
    this.productId = productId;
  }
}

