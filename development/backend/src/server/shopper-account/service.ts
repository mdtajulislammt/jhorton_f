import { prisma } from '../db';
import {
  ShopperAccountError,
  RegisterShopperInput,
  LoginShopperInput,
  UpdateShopperProfileInput,
  CreateShopperAddressInput,
  UpdateShopperAddressInput,
  RequestPasswordResetInput,
  ConfirmPasswordResetInput,
  ShopperProfileDto,
  ShopperAddressDto,
  ShopperOrderSummaryDto,
} from './types';
import {
  hashPassword,
  verifyPassword,
  signShopperToken,
  generatePasswordResetToken,
  hashResetToken,
} from './crypto';
import { checkRateLimit } from './rate-limiter';
import { defaultMailer, MailerService } from './mailer';
import { CartStatus } from '@prisma/client';

export function formatShopperProfile(shopper: any): ShopperProfileDto {
  return {
    id: shopper.id,
    email: shopper.email,
    firstName: shopper.firstName || null,
    lastName: shopper.lastName || null,
    phone: shopper.phone || null,
    homeZip: shopper.homeZip || null,
    defaultDispensaryId: shopper.defaultDispensaryId || null,
    defaultDispensary: shopper.defaultDispensary
      ? {
          id: shopper.defaultDispensary.id,
          name: shopper.defaultDispensary.name,
          slug: shopper.defaultDispensary.slug,
          address: shopper.defaultDispensary.address,
          city: shopper.defaultDispensary.city,
          zip: shopper.defaultDispensary.zip,
          offersPickup: shopper.defaultDispensary.offersPickup,
          offersDelivery: shopper.defaultDispensary.offersDelivery,
        }
      : null,
    createdAt: shopper.createdAt instanceof Date
      ? shopper.createdAt.toISOString()
      : new Date(shopper.createdAt).toISOString(),
  };
}

export function formatShopperAddress(address: any): ShopperAddressDto {
  return {
    id: address.id,
    shopperId: address.shopperId,
    label: address.label || null,
    line1: address.line1,
    line2: address.line2 || null,
    city: address.city,
    state: address.state,
    zip: address.zip,
    isDefault: address.isDefault,
    createdAt: address.createdAt instanceof Date
      ? address.createdAt.toISOString()
      : new Date(address.createdAt).toISOString(),
  };
}

/**
 * Registers a new shopper account.
 * (docs/08 §13, docs/10 §1, REQ-F-014, AC-PRF-02)
 */
export async function registerShopper(
  input: RegisterShopperInput,
  cartSessionToken?: string | null
): Promise<{ shopper: ShopperProfileDto; token: string; expiresAt: Date }> {
  const email = input.email.toLowerCase().trim();

  const existing = await prisma.shopper.findUnique({
    where: { email },
  });

  if (existing) {
    throw new ShopperAccountError(
      'EMAIL_TAKEN',
      'An account with this email address already exists',
      409
    );
  }

  const passwordHash = await hashPassword(input.password);

  const shopper = await prisma.$transaction(async (tx) => {
    const created = await tx.shopper.create({
      data: {
        email,
        passwordHash,
        firstName: input.firstName || null,
        lastName: input.lastName || null,
        phone: input.phone || null,
        homeZip: input.homeZip || null,
      },
      include: {
        defaultDispensary: true,
      },
    });

    // If an anonymous cart session is provided, associate it with the newly registered shopper
    if (cartSessionToken) {
      const anonCart = await tx.cart.findUnique({
        where: { sessionToken: cartSessionToken },
      });
      if (anonCart && anonCart.status === CartStatus.ACTIVE) {
        await tx.cart.update({
          where: { id: anonCart.id },
          data: { shopperId: created.id },
        });
      }
    }

    return created;
  });

  const { token, expiresAt } = await signShopperToken({ shopperId: shopper.id });

  return {
    shopper: formatShopperProfile(shopper),
    token,
    expiresAt,
  };
}

/**
 * Merges anonymous cart items into the shopper's active cart.
 * Quantities are capped at 10 per line.
 */
async function mergeAnonymousCartIntoShopperCart(
  tx: any,
  shopperId: string,
  anonSessionToken: string
): Promise<void> {
  const anonCart = await tx.cart.findUnique({
    where: { sessionToken: anonSessionToken },
    include: { items: true },
  });

  if (!anonCart || anonCart.status !== CartStatus.ACTIVE || anonCart.items.length === 0) {
    if (anonCart && anonCart.status === CartStatus.ACTIVE && !anonCart.shopperId) {
      await tx.cart.update({
        where: { id: anonCart.id },
        data: { shopperId },
      });
    }
    return;
  }

  // Look for an existing active cart belonging to the shopper
  const shopperCart = await tx.cart.findFirst({
    where: {
      shopperId,
      status: CartStatus.ACTIVE,
      id: { not: anonCart.id },
    },
    include: { items: true },
    orderBy: { lastActivityAt: 'desc' },
  });

  if (!shopperCart) {
    // No prior cart for shopper: simply associate the anonymous cart
    await tx.cart.update({
      where: { id: anonCart.id },
      data: { shopperId },
    });
    return;
  }

  // Merge anonymous items into shopperCart
  for (const anonItem of anonCart.items) {
    const existing = shopperCart.items.find(
      (item: any) =>
        item.productId === anonItem.productId &&
        (item.channelBrandId || null) === (anonItem.channelBrandId || null)
    );

    if (existing) {
      const mergedQty = Math.min(10, existing.quantity + anonItem.quantity);
      await tx.cartItem.update({
        where: { id: existing.id },
        data: { quantity: mergedQty },
      });
    } else {
      const cappedQty = Math.min(10, anonItem.quantity);
      await tx.cartItem.create({
        data: {
          cartId: shopperCart.id,
          productId: anonItem.productId,
          quantity: cappedQty,
          unitPrice: anonItem.unitPrice,
          channelBrandId: anonItem.channelBrandId,
          preferredDispensaryId: anonItem.preferredDispensaryId,
        },
      });
    }
  }

  // Deactivate the anonymous cart
  await tx.cart.update({
    where: { id: anonCart.id },
    data: {
      status: CartStatus.EXPIRED,
    },
  });

  // Touch shopper cart lastActivityAt
  await tx.cart.update({
    where: { id: shopperCart.id },
    data: { lastActivityAt: new Date() },
  });
}

/**
 * Authenticates a shopper and handles cart merging.
 * Rate limited to 5 attempts per minute.
 * (docs/08 §13, docs/10 §1, REQ-F-014, AC-PRF-02)
 */
export async function loginShopper(
  input: LoginShopperInput,
  cartSessionToken?: string | null,
  clientIp?: string
): Promise<{ shopper: ShopperProfileDto; token: string; expiresAt: Date }> {
  const email = input.email.toLowerCase().trim();

  // Rate limiting (5 attempts/min per IP/email)
  const rateLimitKey = `login:${clientIp || 'unknown'}:${email}`;
  const rateResult = checkRateLimit(rateLimitKey, 5, 60 * 1000);
  if (!rateResult.allowed) {
    throw new ShopperAccountError(
      'TOO_MANY_REQUESTS',
      'Too many login attempts. Please wait 1 minute before trying again.',
      429
    );
  }

  const shopper = await prisma.shopper.findUnique({
    where: { email },
    include: { defaultDispensary: true },
  });

  if (!shopper) {
    throw new ShopperAccountError(
      'INVALID_CREDENTIALS',
      'Invalid email address or password',
      401
    );
  }

  const isPasswordValid = await verifyPassword(shopper.passwordHash, input.password);
  if (!isPasswordValid) {
    throw new ShopperAccountError(
      'INVALID_CREDENTIALS',
      'Invalid email address or password',
      401
    );
  }

  // Merge anonymous cart into shopper's account if sessionToken exists
  if (cartSessionToken) {
    await prisma.$transaction(async (tx) => {
      await mergeAnonymousCartIntoShopperCart(tx, shopper.id, cartSessionToken);
    });
  }

  const { token, expiresAt } = await signShopperToken({ shopperId: shopper.id });

  return {
    shopper: formatShopperProfile(shopper),
    token,
    expiresAt,
  };
}

/**
 * Retrieves the shopper profile.
 */
export async function getShopperProfile(shopperId: string): Promise<ShopperProfileDto> {
  const shopper = await prisma.shopper.findUnique({
    where: { id: shopperId },
    include: { defaultDispensary: true },
  });

  if (!shopper) {
    throw new ShopperAccountError('NOT_FOUND', 'Shopper account not found', 404);
  }

  return formatShopperProfile(shopper);
}

/**
 * Updates the shopper profile (name, phone, homeZip, default partner store).
 * Default store must be an active partner dispensary.
 * (docs/08 §13, REQ-F-013, AC-SEL-02)
 */
export async function updateShopperProfile(
  shopperId: string,
  input: UpdateShopperProfileInput
): Promise<ShopperProfileDto> {
  if (input.defaultDispensaryId) {
    const dispensary = await prisma.dispensary.findUnique({
      where: { id: input.defaultDispensaryId },
    });
    if (!dispensary || !dispensary.isActive) {
      throw new ShopperAccountError(
        'INVALID_DISPENSARY',
        'Selected store is not an active partner dispensary',
        422
      );
    }
  }

  const updated = await prisma.shopper.update({
    where: { id: shopperId },
    data: {
      firstName: input.firstName !== undefined ? input.firstName : undefined,
      lastName: input.lastName !== undefined ? input.lastName : undefined,
      phone: input.phone !== undefined ? input.phone : undefined,
      homeZip: input.homeZip !== undefined ? input.homeZip : undefined,
      defaultDispensaryId:
        input.defaultDispensaryId !== undefined
          ? input.defaultDispensaryId
          : undefined,
    },
    include: { defaultDispensary: true },
  });

  return formatShopperProfile(updated);
}

/**
 * Lists all saved addresses for a shopper. Default address appears first.
 */
export async function listShopperAddresses(
  shopperId: string
): Promise<ShopperAddressDto[]> {
  const addresses = await prisma.shopperAddress.findMany({
    where: { shopperId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  return addresses.map(formatShopperAddress);
}

/**
 * Creates a new saved address for a shopper.
 */
export async function createShopperAddress(
  shopperId: string,
  input: CreateShopperAddressInput
): Promise<ShopperAddressDto> {
  const count = await prisma.shopperAddress.count({
    where: { shopperId },
  });

  const shouldBeDefault = input.isDefault || count === 0;

  return await prisma.$transaction(async (tx) => {
    if (shouldBeDefault) {
      await tx.shopperAddress.updateMany({
        where: { shopperId },
        data: { isDefault: false },
      });
    }

    const created = await tx.shopperAddress.create({
      data: {
        shopperId,
        label: input.label || null,
        line1: input.line1,
        line2: input.line2 || null,
        city: input.city,
        state: input.state || 'NY',
        zip: input.zip,
        isDefault: shouldBeDefault,
      },
    });

    return formatShopperAddress(created);
  });
}

/**
 * Updates an existing address.
 */
export async function updateShopperAddress(
  shopperId: string,
  addressId: string,
  input: UpdateShopperAddressInput
): Promise<ShopperAddressDto> {
  const existing = await prisma.shopperAddress.findFirst({
    where: { id: addressId, shopperId },
  });

  if (!existing) {
    throw new ShopperAccountError('ADDRESS_NOT_FOUND', 'Address not found', 404);
  }

  return await prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.shopperAddress.updateMany({
        where: { shopperId, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    const updated = await tx.shopperAddress.update({
      where: { id: addressId },
      data: {
        label: input.label !== undefined ? input.label : undefined,
        line1: input.line1 !== undefined ? input.line1 : undefined,
        line2: input.line2 !== undefined ? input.line2 : undefined,
        city: input.city !== undefined ? input.city : undefined,
        state: input.state !== undefined ? input.state : undefined,
        zip: input.zip !== undefined ? input.zip : undefined,
        isDefault: input.isDefault !== undefined ? input.isDefault : undefined,
      },
    });

    return formatShopperAddress(updated);
  });
}

/**
 * Deletes a saved address.
 * If the deleted address was default and other addresses remain, sets the newest one as default.
 */
export async function deleteShopperAddress(
  shopperId: string,
  addressId: string
): Promise<{ success: boolean }> {
  const existing = await prisma.shopperAddress.findFirst({
    where: { id: addressId, shopperId },
  });

  if (!existing) {
    throw new ShopperAccountError('ADDRESS_NOT_FOUND', 'Address not found', 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.shopperAddress.delete({
      where: { id: addressId },
    });

    if (existing.isDefault) {
      const remaining = await tx.shopperAddress.findFirst({
        where: { shopperId },
        orderBy: { createdAt: 'desc' },
      });
      if (remaining) {
        await tx.shopperAddress.update({
          where: { id: remaining.id },
          data: { isDefault: true },
        });
      }
    }
  });

  return { success: true };
}

/**
 * Requests a single-use 1-hour password reset link.
 * Anti-enumeration: always returns 200 success.
 * (docs/08 §13, docs/10 §1)
 */
export async function requestPasswordReset(
  input: RequestPasswordResetInput,
  baseUrl: string,
  clientIp?: string,
  mailer: MailerService = defaultMailer
): Promise<{ success: boolean; message: string }> {
  const email = input.email.toLowerCase().trim();

  // Rate limit by IP + email (5 / min)
  const rateLimitKey = `reset:${clientIp || 'unknown'}:${email}`;
  const rateResult = checkRateLimit(rateLimitKey, 5, 60 * 1000);
  if (!rateResult.allowed) {
    throw new ShopperAccountError(
      'TOO_MANY_REQUESTS',
      'Too many password reset requests. Please wait 1 minute before trying again.',
      429
    );
  }

  const shopper = await prisma.shopper.findUnique({
    where: { email },
  });

  if (shopper) {
    // Invalidate existing unused tokens for this shopper
    await prisma.passwordResetToken.deleteMany({
      where: { shopperId: shopper.id, usedAt: null },
    });

    const { token, tokenHash, expiresAt } = generatePasswordResetToken(1);

    await prisma.passwordResetToken.create({
      data: {
        shopperId: shopper.id,
        tokenHash,
        expiresAt,
      },
    });

    const resetUrl = `${baseUrl.replace(/\/$/, '')}/account/reset?token=${token}`;
    await mailer.sendPasswordResetEmail(email, resetUrl);
  }

  return {
    success: true,
    message: 'If an account exists with that email, a password reset link has been sent.',
  };
}

/**
 * Confirms password reset with single-use token.
 * (docs/08 §13, docs/10 §1)
 */
export async function confirmPasswordReset(
  input: ConfirmPasswordResetInput
): Promise<{ success: boolean }> {
  const tokenHash = hashResetToken(input.token);

  const resetRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { shopper: true },
  });

  if (
    !resetRecord ||
    resetRecord.usedAt !== null ||
    resetRecord.expiresAt.getTime() < Date.now()
  ) {
    throw new ShopperAccountError(
      'INVALID_RESET_TOKEN',
      'Password reset link is invalid or has expired',
      400
    );
  }

  const newPasswordHash = await hashPassword(input.password);

  await prisma.$transaction(async (tx) => {
    await tx.shopper.update({
      where: { id: resetRecord.shopperId },
      data: { passwordHash: newPasswordHash },
    });

    await tx.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    });
  });

  return { success: true };
}

/**
 * Retrieves the shopper's past orders (newest first).
 * (docs/08 §13)
 */
export async function getShopperOrders(
  shopperId: string
): Promise<ShopperOrderSummaryDto[]> {
  const orders = await prisma.order.findMany({
    where: { shopperId },
    include: {
      subOrders: {
        include: {
          dispensary: true,
          items: {
            include: {
              product: {
                include: {
                  brand: true,
                  strain: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    fulfillmentType: order.fulfillmentType,
    status: order.status,
    subtotal: order.subtotal.toFixed(2),
    zip: order.zip,
    createdAt: order.createdAt.toISOString(),
    subOrders: order.subOrders.map((sub) => ({
      id: sub.id,
      subOrderNumber: sub.confirmationRef || sub.id.slice(0, 8).toUpperCase(),
      dispensaryId: sub.dispensaryId,
      dispensaryName: sub.dispensary.name,
      dispensarySlug: sub.dispensary.slug,
      status: sub.status,
      subtotal: sub.subtotal.toFixed(2),
      handoffUrl: sub.handoffUrl,
      confirmedAt: sub.confirmedAt ? sub.confirmedAt.toISOString() : null,
      items: sub.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        brandName: item.product.brand?.name || null,
        strainType: item.product.strain?.name || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        lineTotal: (Number(item.unitPrice) * item.quantity).toFixed(2),
      })),
    })),
  }));
}
