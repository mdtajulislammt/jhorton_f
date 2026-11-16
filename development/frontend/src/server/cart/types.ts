import { z } from 'zod';
import { CartStatus } from '@prisma/client';
import { PriceMode } from '../pricing';
import { CartHoldMetadata } from './expiry';

export type { CartHoldMetadata } from './expiry';

export const cartProductInputSchema = z.object({
  externalId: z.string().trim().optional(),
  productId: z.string().uuid().optional(),
  sku: z.string().trim().optional(),
  quantity: z.number().int().min(0).max(10),
  preferredDispensaryId: z.string().uuid().optional(),
});

export const cartSyncSchema = z.object({
  action: z.enum(['addProductToCart', 'updateProductInCart', 'removeProductFromCart']),
  source: z
    .enum(['catalog', 'brand_storefront', 'terrific_live', 'terrific_replay', 'terrific_video'])
    .optional()
    .default('catalog'),
  liveShowId: z.string().uuid().optional(),
  channelBrandSlug: z.string().trim().optional(),
  cartProducts: z.array(cartProductInputSchema).min(1).max(30),
});

export type CartSyncAction = 'addProductToCart' | 'updateProductInCart' | 'removeProductFromCart';
export type CartProductInput = z.infer<typeof cartProductInputSchema>;
export type CartSyncPayload = z.input<typeof cartSyncSchema>;

export interface CartLineDto {
  id: string;
  productId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  priceMode: PriceMode;
  unitPrice: string;
  fromPrice: string;
  lineTotal: string;
  source: string;
  channelBrand: {
    id: string;
    name: string;
    slug: string;
  } | null;
  preferredDispensaryId: string | null;
  strain: {
    name: string;
    type: string;
  } | null;
  category: {
    name: string;
    slug: string;
  };
}

export interface CartDetailDto {
  id: string;
  sessionToken: string;
  status: CartStatus;
  expiresAt: string;
  lastActivityAt: string;
  hold: CartHoldMetadata;
  items: CartLineDto[];
  itemCount: number;
  estimatedSubtotal: string;
}

export interface UnmappedProductError {
  code: 'UNMAPPED_PRODUCT';
  message: string;
  details: Array<{
    productId?: string;
    externalId?: string;
    sku?: string;
    reason: string;
  }>;
}
