import { z } from 'zod';
import {
  FulfillmentType,
  OrderStatus,
  SubOrderStatus,
  AssignmentSource,
  HandoffChannel,
} from '@prisma/client';
import { UnfulfillableLine } from '../distribution/types';

// ============================================================================
// ZOD SCHEMAS (Strict mode to reject DOB, ID, and payment fields - AC-SEC-01)
// ============================================================================

export const contactSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required').max(50),
    lastName: z.string().trim().min(1, 'Last name is required').max(50),
    email: z.string().trim().email('Valid email is required'),
    phone: z.string().trim().min(7, 'Valid phone number is required').max(20),
  })
  .strict();

export const deliveryAddressSchema = z
  .object({
    line1: z.string().trim().min(1, 'Street address is required').max(100),
    line2: z.string().trim().max(100).optional().nullable(),
    city: z.string().trim().min(1, 'City is required').max(50),
    state: z.string().trim().min(2).max(2).default('NY'),
    zip: z.string().trim().regex(/^\d{5}$/, 'Valid 5-digit ZIP code required'),
  })
  .strict();

export const itemOverrideSchema = z
  .object({
    productId: z.string().uuid('Valid product UUID required'),
    dispensaryId: z.string().uuid('Valid dispensary UUID required'),
  })
  .strict();

export const previewDistributionSchema = z
  .object({
    fulfillmentType: z.enum(['PICKUP', 'DELIVERY']),
    zip: z
      .string()
      .trim()
      .regex(/^\d{5}$/, 'Valid 5-digit ZIP code required')
      .optional()
      .nullable(),
    preferredDispensaryId: z.string().uuid().optional().nullable(),
    itemOverrides: z.array(itemOverrideSchema).optional().default([]),
  })
  .strict()
  .refine(
    (data) => {
      if (data.fulfillmentType === 'DELIVERY' && !data.zip) {
        return false;
      }
      return true;
    },
    {
      message: 'ZIP code is required for DELIVERY fulfillment',
      path: ['zip'],
    }
  );

export const createOrderSchema = z
  .object({
    fulfillmentType: z.enum(['PICKUP', 'DELIVERY']),
    zip: z.string().trim().regex(/^\d{5}$/, 'Valid 5-digit ZIP code required'),
    preferredDispensaryId: z.string().uuid().optional().nullable(),
    itemOverrides: z.array(itemOverrideSchema).optional().default([]),
    contact: contactSchema,
    deliveryAddress: deliveryAddressSchema.optional().nullable(),
    saveToProfile: z.boolean().optional().default(false),
    previewHash: z.string().trim().min(1, 'Preview hash is required'),
  })
  .strict()
  .refine(
    (data) => {
      if (data.fulfillmentType === 'DELIVERY') {
        if (!data.deliveryAddress) return false;
        if (data.deliveryAddress.zip !== data.zip) return false;
      }
      return true;
    },
    {
      message:
        'A complete delivery address with matching ZIP is required for DELIVERY fulfillment',
      path: ['deliveryAddress'],
    }
  );

export type ContactInput = z.infer<typeof contactSchema>;
export type DeliveryAddressInput = z.infer<typeof deliveryAddressSchema>;
export type ItemOverrideInput = z.infer<typeof itemOverrideSchema>;
export type PreviewDistributionInput = z.infer<typeof previewDistributionSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export interface OrderItemDetailDto {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export interface SubOrderDetailDto {
  id: string;
  dispensaryId: string;
  dispensaryName: string;
  fulfillmentType: FulfillmentType;
  assignment: AssignmentSource;
  channelBrandId: string | null;
  status: SubOrderStatus;
  handoffChannel: HandoffChannel;
  handoffUrl: string | null;
  handedOffAt: string | null;
  confirmationRef: string | null;
  confirmationUrl: string | null;
  confirmedAt: string | null;
  subtotal: string;
  items: OrderItemDetailDto[];
}

export interface OrderCreatedDto {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: string;
  subOrders: Array<{
    id: string;
    dispensaryId: string;
    status: SubOrderStatus;
    subtotal: string;
  }>;
}

export interface OrderDetailDto {
  id: string;
  orderNumber: string;
  cartId: string | null;
  shopperId: string | null;
  fulfillmentType: FulfillmentType;
  zip: string;
  status: OrderStatus;
  subtotal: string;
  contact: ContactInput;
  deliveryAddress: DeliveryAddressInput | null;
  createdAt: string;
  updatedAt: string;
  subOrders: SubOrderDetailDto[];
}

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class UnfulfillableItemsError extends Error {
  readonly code = 'UNFULFILLABLE_ITEMS';
  readonly unfulfillable: UnfulfillableLine[];

  constructor(unfulfillable: UnfulfillableLine[]) {
    super('The cart contains items that cannot be fulfilled for the selected destination');
    this.name = 'UnfulfillableItemsError';
    this.unfulfillable = unfulfillable;
  }
}

export class PreviewStaleError extends Error {
  readonly code = 'PREVIEW_STALE';

  constructor(
    message = 'Stock availability or pricing has changed since preview. Please review updated preview.'
  ) {
    super(message);
    this.name = 'PreviewStaleError';
  }
}

export class OrderNotFoundError extends Error {
  readonly code = 'NOT_FOUND';

  constructor(message = 'Order not found') {
    super(message);
    this.name = 'OrderNotFoundError';
  }
}

export class ForbiddenOrderAccessError extends Error {
  readonly code = 'FORBIDDEN';

  constructor(message = 'Access to order denied') {
    super(message);
    this.name = 'ForbiddenOrderAccessError';
  }
}

export class CartEmptyError extends Error {
  readonly code = 'CART_EMPTY';

  constructor(message = 'Cannot create order from an empty cart') {
    super(message);
    this.name = 'CartEmptyError';
  }
}

