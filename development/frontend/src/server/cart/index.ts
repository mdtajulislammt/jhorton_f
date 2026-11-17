import { prisma } from '../db';
import { CartStatus, ShowStatus, Prisma } from '@prisma/client';
import { computeCatalogPricing, formatMoney, PriceMode } from '../pricing';
import { resolveProduct } from '../products';
import {
  calculateCartExpiration,
  isCartExpired,
  CartHoldMetadata,
  CART_INACTIVITY_TTL_MS,
} from './expiry';
import {
  generateCartSessionToken,
} from './session';
import {
  CartDetailDto,
  CartLineDto,
  CartSyncPayload,
  CartProductInput,
} from './types';

export class CartExpiredError extends Error {
  constructor(message = 'Your cart hold has expired') {
    super(message);
    this.name = 'CartExpiredError';
  }
}

export class UnmappedProductException extends Error {
  public details: Array<{
    productId?: string;
    externalId?: string;
    sku?: string;
    reason: string;
  }>;

  constructor(
    details: Array<{
      productId?: string;
      externalId?: string;
      sku?: string;
      reason: string;
    }>
  ) {
    super('One or more products could not be resolved in the catalog');
    this.name = 'UnmappedProductException';
    this.details = details;
  }
}

export type CartWithRelations = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        product: {
          include: {
            category: true;
            strain: true;
            brand: true;
            inventory: { include: { dispensary: { select: { isActive: true } } } };
          };
        };
        channelBrand: true;
      };
    };
    liveShow: true;
  };
}>;

const cartInclude = {
  items: {
    include: {
      product: {
        include: {
          category: true,
          strain: true,
          brand: true,
          // isActive lets the cart price per-store lines from active stores only (same as the catalog)
          inventory: { include: { dispensary: { select: { isActive: true } } } },
        },
      },
      channelBrand: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
  liveShow: true,
};

/**
 * Transforms a Cart model with relations into the standardized CartDetailDto (docs/08 §4.1).
 */
export function formatCartDto(cart: CartWithRelations, now = new Date()): CartDetailDto {
  const { expiresAt, hold } = calculateCartExpiration(
    {
      lastActivityAt: cart.lastActivityAt,
      liveShowId: cart.liveShowId,
    },
    cart.liveShow,
    now
  );

  let totalItemCount = 0;
  let subtotalAcc = 0;

  const items: CartLineDto[] = cart.items.map((item) => {
    const product = item.product;
    // Same pool as the catalog "From" price: active partner stores only. Without the inventory list,
    // per-store lines with no preferred store were priced at $0.00 (TASK-023).
    const activeInventories = product.inventory.filter((inv) => inv.dispensary?.isActive !== false);
    const pricing = computeCatalogPricing(product, activeInventories);

    let priceMode: PriceMode;
    let unitPrice: string;
    let fromPrice: string;

    if (product.owtletPrice != null) {
      priceMode = 'OWTLET';
      unitPrice = formatMoney(product.owtletPrice);
      fromPrice = unitPrice;
    } else {
      priceMode = 'PER_STORE';
      fromPrice = pricing.fromPrice || '0.00';
      if (item.preferredDispensaryId) {
        const storeInv = product.inventory.find(
          (inv) => inv.dispensaryId === item.preferredDispensaryId
        );
        unitPrice = (storeInv ? formatMoney(storeInv.price) : pricing.fromPrice) || '0.00';
      } else {
        unitPrice = pricing.fromPrice || '0.00';
      }
    }

    const lineTotalNum = Number(unitPrice) * item.quantity;
    subtotalAcc += lineTotalNum;
    totalItemCount += item.quantity;

    return {
      id: item.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: product.imageUrls[0] || null,
      quantity: item.quantity,
      priceMode,
      unitPrice,
      fromPrice,
      lineTotal: lineTotalNum.toFixed(2),
      source: item.source,
      channelBrand: item.channelBrand
        ? {
            id: item.channelBrand.id,
            name: item.channelBrand.name,
            slug: item.channelBrand.slug,
          }
        : null,
      preferredDispensaryId: item.preferredDispensaryId,
      strain: product.strain
        ? {
            name: product.strain.name,
            type: product.strain.type,
          }
        : null,
      category: {
        name: product.category.name,
        slug: product.category.slug,
      },
    };
  });

  return {
    id: cart.id,
    sessionToken: cart.sessionToken,
    status: cart.status,
    expiresAt: expiresAt.toISOString(),
    lastActivityAt: cart.lastActivityAt.toISOString(),
    hold,
    items,
    itemCount: totalItemCount,
    estimatedSubtotal: subtotalAcc.toFixed(2),
  };
}

/**
 * Retrieves an active cart by its session token.
 * If expired, updates status to EXPIRED and returns null.
 */
export async function getCartBySessionToken(
  sessionToken: string
): Promise<{ cart: CartDetailDto | null; isExpired: boolean }> {
  const cart = await prisma.cart.findUnique({
    where: { sessionToken },
    include: cartInclude,
  });

  if (!cart) {
    return { cart: null, isExpired: false };
  }

  const expired = isCartExpired(cart);
  if (expired) {
    if (cart.status !== CartStatus.EXPIRED) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: { status: CartStatus.EXPIRED },
      });
    }
    return { cart: null, isExpired: true };
  }

  // If held by live show, refresh expiresAt in DB
  const { expiresAt } = calculateCartExpiration(
    { lastActivityAt: cart.lastActivityAt, liveShowId: cart.liveShowId },
    cart.liveShow
  );
  if (expiresAt.getTime() !== cart.expiresAt.getTime()) {
    await prisma.cart.update({
      where: { id: cart.id },
      data: { expiresAt },
    });
    cart.expiresAt = expiresAt;
  }

  return { cart: formatCartDto(cart), isExpired: false };
}

/**
 * Gets the existing active cart or creates a brand new one.
 */
export async function getOrCreateCart(
  sessionToken?: string | null,
  shopperId?: string | null
): Promise<{
  cart: CartDetailDto;
  sessionToken: string;
  isNew: boolean;
  wasExpired: boolean;
}> {
  if (sessionToken) {
    const existing = await prisma.cart.findUnique({
      where: { sessionToken },
      include: cartInclude,
    });

    if (existing) {
      const expired = isCartExpired(existing);
      if (!expired && existing.status === CartStatus.ACTIVE) {
        // Active valid cart
        if (shopperId && !existing.shopperId) {
          await prisma.cart.update({
            where: { id: existing.id },
            data: { shopperId },
          });
          existing.shopperId = shopperId;
        }
        return {
          cart: formatCartDto(existing),
          sessionToken: existing.sessionToken,
          isNew: false,
          wasExpired: false,
        };
      } else {
        // Mark expired
        if (existing.status !== CartStatus.EXPIRED) {
          await prisma.cart.update({
            where: { id: existing.id },
            data: { status: CartStatus.EXPIRED },
          });
        }
      }
    }
  }

  // Issue new cart
  const newSessionToken = generateCartSessionToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CART_INACTIVITY_TTL_MS);

  const createdCart = await prisma.cart.create({
    data: {
      sessionToken: newSessionToken,
      shopperId: shopperId || null,
      status: CartStatus.ACTIVE,
      lastActivityAt: now,
      expiresAt,
    },
    include: cartInclude,
  });

  return {
    cart: formatCartDto(createdCart),
    sessionToken: newSessionToken,
    isNew: true,
    wasExpired: Boolean(sessionToken),
  };
}

/**
 * Resolves all product references in the cartProducts array.
 * If any product cannot be found or is inactive, throws UnmappedProductException.
 */
export async function resolveCartProducts(
  items: CartProductInput[]
): Promise<Array<{ input: CartProductInput; productId: string }>> {
  const resolvedList: Array<{ input: CartProductInput; productId: string }> = [];
  const unmapped: Array<{
    productId?: string;
    externalId?: string;
    sku?: string;
    reason: string;
  }> = [];

  for (const item of items) {
    const resolved = await resolveProduct({
      productId: item.productId,
      terrificProductId: item.externalId,
      externalId: item.externalId,
      sku: item.sku,
    });

    if (!resolved) {
      unmapped.push({
        productId: item.productId,
        externalId: item.externalId,
        sku: item.sku,
        reason: 'Unmapped cannabis product or product inactive',
      });
    } else {
      resolvedList.push({
        input: item,
        productId: resolved.id,
      });
    }
  }

  if (unmapped.length > 0) {
    throw new UnmappedProductException(unmapped);
  }

  return resolvedList;
}

/**
 * Synchronizes cart items with atomic mutations and recomputed hold expiration.
 * Handles addProductToCart, updateProductInCart, removeProductFromCart.
 */
export async function syncCartItems(
  sessionToken: string,
  payload: CartSyncPayload
): Promise<CartDetailDto> {
  // 1. Resolve products upfront. If any is unmapped, reject without modifying DB.
  const resolvedProducts = await resolveCartProducts(payload.cartProducts);

  // 2. Resolve brand if channelBrandSlug provided
  let channelBrandId: string | null = null;
  if (payload.channelBrandSlug) {
    const brand = await prisma.brand.findUnique({
      where: { slug: payload.channelBrandSlug },
      select: { id: true },
    });
    if (brand) {
      channelBrandId = brand.id;
    }
  }

  // 3. Resolve live show if liveShowId provided
  let liveShowRecord = null;
  if (payload.liveShowId) {
    liveShowRecord = await prisma.liveShow.findUnique({
      where: { id: payload.liveShowId },
      select: {
        id: true,
        title: true,
        status: true,
        endedAt: true,
        scheduledEndAt: true,
      },
    });
  }

  // 4. Atomic transaction
  const updatedCart = await prisma.$transaction(async (tx) => {
    let cart = await tx.cart.findUnique({
      where: { sessionToken },
      include: cartInclude,
    });

    if (!cart) {
      // Create if doesn't exist
      const now = new Date();
      cart = await tx.cart.create({
        data: {
          sessionToken,
          status: CartStatus.ACTIVE,
          lastActivityAt: now,
          expiresAt: new Date(now.getTime() + CART_INACTIVITY_TTL_MS),
        },
        include: cartInclude,
      });
    }

    if (isCartExpired(cart)) {
      await tx.cart.update({
        where: { id: cart.id },
        data: { status: CartStatus.EXPIRED },
      });
      throw new CartExpiredError();
    }

    const now = new Date();

    // Link liveShowId if product is added from a LIVE show
    let newLiveShowId = cart.liveShowId;
    if (
      payload.liveShowId &&
      liveShowRecord &&
      (liveShowRecord.status === ShowStatus.LIVE || !cart.liveShowId)
    ) {
      newLiveShowId = payload.liveShowId;
    }

    // Process each item
    for (const { input, productId } of resolvedProducts) {
      // Find existing item with NULL-safe channelBrandId matching
      const existingItem = await tx.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
          channelBrandId: channelBrandId ?? null,
        },
      });

      if (payload.action === 'addProductToCart') {
        if (existingItem) {
          const newQty = Math.min(10, existingItem.quantity + (input.quantity || 1));
          await tx.cartItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: newQty,
              source: payload.source || existingItem.source,
              liveShowId: payload.liveShowId || existingItem.liveShowId,
              preferredDispensaryId:
                input.preferredDispensaryId || existingItem.preferredDispensaryId,
            },
          });
        } else {
          // Check max line items (30)
          const currentItemCount = await tx.cartItem.count({
            where: { cartId: cart.id },
          });
          if (currentItemCount >= 30) {
            throw new Error('Cart limit exceeded. Maximum 30 distinct items allowed.');
          }

          const qty = Math.min(10, Math.max(1, input.quantity || 1));
          await tx.cartItem.create({
            data: {
              cartId: cart.id,
              productId,
              quantity: qty,
              source: payload.source || 'catalog',
              channelBrandId: channelBrandId ?? null,
              liveShowId: payload.liveShowId || null,
              preferredDispensaryId: input.preferredDispensaryId || null,
            },
          });
        }
      } else if (payload.action === 'updateProductInCart') {
        if (existingItem) {
          if (input.quantity <= 0) {
            await tx.cartItem.delete({
              where: { id: existingItem.id },
            });
          } else {
            await tx.cartItem.update({
              where: { id: existingItem.id },
              data: {
                quantity: Math.min(10, input.quantity),
                preferredDispensaryId:
                  input.preferredDispensaryId !== undefined
                    ? input.preferredDispensaryId
                    : existingItem.preferredDispensaryId,
              },
            });
          }
        }
      } else if (payload.action === 'removeProductFromCart') {
        if (existingItem) {
          await tx.cartItem.delete({
            where: { id: existingItem.id },
          });
        }
      }
    }

    // Recompute expiration
    const { expiresAt } = calculateCartExpiration(
      {
        lastActivityAt: now,
        liveShowId: newLiveShowId,
      },
      liveShowRecord,
      now
    );

    const finalizedCart = await tx.cart.update({
      where: { id: cart.id },
      data: {
        lastActivityAt: now,
        expiresAt,
        liveShowId: newLiveShowId,
      },
      include: cartInclude,
    });

    return finalizedCart;
  });

  return formatCartDto(updatedCart);
}

/**
 * Clears all items from the active cart.
 */
export async function clearCart(sessionToken: string): Promise<CartDetailDto> {
  const updatedCart = await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { sessionToken },
      include: cartInclude,
    });

    if (!cart) {
      throw new Error('Cart not found');
    }

    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + CART_INACTIVITY_TTL_MS);

    return tx.cart.update({
      where: { id: cart.id },
      data: {
        lastActivityAt: now,
        expiresAt,
        liveShowId: null,
      },
      include: cartInclude,
    });
  });

  return formatCartDto(updatedCart);
}
