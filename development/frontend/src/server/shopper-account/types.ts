import { z } from 'zod';

export class ShopperAccountError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'ShopperAccountError';
  }
}

// ==========================================
// ZOD VALIDATION SCHEMAS (.strict() to reject DOB/ID/payment fields)
// ==========================================

export const registerShopperSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('A valid email address is required'),
    password: z
      .string()
      .min(10, 'Password must be at least 10 characters long'),
    firstName: z.string().trim().max(100).optional().nullable(),
    lastName: z.string().trim().max(100).optional().nullable(),
    phone: z
      .string()
      .trim()
      .regex(/^$|^[\d\+\-\(\)\s]{7,20}$/, 'Invalid phone number format')
      .optional()
      .nullable(),
    homeZip: z
      .string()
      .trim()
      .regex(/^$|^\d{5}$/, 'Invalid 5-digit ZIP code')
      .optional()
      .nullable(),
  })
  .strict();

export type RegisterShopperInput = z.infer<typeof registerShopperSchema>;

export const loginShopperSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('A valid email address is required'),
    password: z.string().min(1, 'Password is required'),
  })
  .strict();

export type LoginShopperInput = z.infer<typeof loginShopperSchema>;

export const updateShopperProfileSchema = z
  .object({
    firstName: z.string().trim().max(100).optional().nullable(),
    lastName: z.string().trim().max(100).optional().nullable(),
    phone: z
      .string()
      .trim()
      .regex(/^$|^[\d\+\-\(\)\s]{7,20}$/, 'Invalid phone number format')
      .optional()
      .nullable(),
    homeZip: z
      .string()
      .trim()
      .regex(/^$|^\d{5}$/, 'Invalid 5-digit ZIP code')
      .optional()
      .nullable(),
    defaultDispensaryId: z.string().uuid().optional().nullable(),
  })
  .strict();

export type UpdateShopperProfileInput = z.infer<typeof updateShopperProfileSchema>;

export const shopperAddressSchema = z
  .object({
    label: z.string().trim().max(50).optional().nullable(),
    line1: z.string().trim().min(3, 'Street address is required').max(150),
    line2: z.string().trim().max(100).optional().nullable(),
    city: z.string().trim().min(2, 'City is required').max(100),
    state: z.string().trim().length(2).default('NY'),
    zip: z.string().trim().regex(/^\d{5}$/, 'Valid 5-digit NY ZIP code required'),
    isDefault: z.boolean().optional().default(false),
  })
  .strict();

export type CreateShopperAddressInput = z.input<typeof shopperAddressSchema>;

export const updateShopperAddressSchema = shopperAddressSchema.partial();
export type UpdateShopperAddressInput = z.infer<typeof updateShopperAddressSchema>;

export const requestPasswordResetSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('A valid email address is required'),
  })
  .strict();

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

export const confirmPasswordResetSchema = z
  .object({
    token: z.string().trim().min(1, 'Reset token is required'),
    password: z
      .string()
      .min(10, 'Password must be at least 10 characters long'),
  })
  .strict();

export type ConfirmPasswordResetInput = z.infer<typeof confirmPasswordResetSchema>;

// ==========================================
// CONTRACT DTOS
// ==========================================

export interface ShopperDispensarySummaryDto {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  zip: string;
  offersPickup: boolean;
  offersDelivery: boolean;
}

export interface ShopperProfileDto {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  homeZip: string | null;
  defaultDispensaryId: string | null;
  defaultDispensary: ShopperDispensarySummaryDto | null;
  createdAt: string;
}

export interface ShopperAddressDto {
  id: string;
  shopperId: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
  createdAt: string;
}

export interface ShopperOrderItemDto {
  id: string;
  productId: string;
  productName: string;
  brandName: string | null;
  strainType: string | null;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export interface ShopperSubOrderSummaryDto {
  id: string;
  subOrderNumber: string;
  dispensaryId: string;
  dispensaryName: string;
  dispensarySlug: string;
  status: string;
  subtotal: string;
  handoffUrl: string | null;
  confirmedAt: string | null;
  items: ShopperOrderItemDto[];
}

export interface ShopperOrderSummaryDto {
  id: string;
  orderNumber: string;
  fulfillmentType: string;
  status: string;
  subtotal: string;
  zip: string;
  createdAt: string;
  subOrders: ShopperSubOrderSummaryDto[];
}

