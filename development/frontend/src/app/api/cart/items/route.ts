import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import {
  syncCartItems,
  getOrCreateCart,
  UnmappedProductException,
  CartExpiredError,
} from '@/server/cart';
import {
  getCartSessionToken,
  attachCartCookie,
} from '@/server/cart/session';
import { cartSyncSchema, CartSyncAction } from '@/server/cart/types';
import { ZodError } from 'zod';

async function handleSync(request: NextRequest, defaultAction?: CartSyncAction) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return fail('INVALID_JSON', 'Request body must be valid JSON', 400);
  }

  if (!body.action && defaultAction) {
    body.action = defaultAction;
  }

  // Zod validation
  const parsed = cartSyncSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      'VALIDATION_ERROR',
      'Invalid cart payload parameters',
      400,
      parsed.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
    );
  }

  let sessionToken = getCartSessionToken(request);
  let isNewSession = false;

  if (!sessionToken) {
    const fresh = await getOrCreateCart(null);
    sessionToken = fresh.sessionToken;
    isNewSession = true;
  }

  try {
    const updatedCart = await syncCartItems(sessionToken, parsed.data);
    const res = ok(updatedCart, 'Cart synchronized successfully');
    if (isNewSession) {
      attachCartCookie(res, sessionToken);
    }
    return res;
  } catch (error: any) {
    if (error instanceof UnmappedProductException) {
      return fail('UNMAPPED_PRODUCT', error.message, 404, error.details);
    }

    if (error instanceof CartExpiredError) {
      // Issue a new fresh cart
      const fresh = await getOrCreateCart(null);
      const res = fail(
        'CART_EXPIRED',
        'Your cannabis cart hold has expired. A fresh cart has been issued.',
        410,
        [{ newCartId: fresh.cart.id, expiresAt: fresh.cart.expiresAt }]
      );
      attachCartCookie(res, fresh.sessionToken);
      return res;
    }

    if (error.message?.includes('Cart limit exceeded')) {
      return fail('CART_LIMIT_EXCEEDED', error.message, 400);
    }

    console.error('Error synchronizing cart items:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to update cart items', 500);
  }
}

/**
 * POST /api/cart/items
 * Adds cannabis products to the cart (docs/08 §4.2).
 * Compatible with Terrific cartSyncHandler({ action: 'addProductToCart', cartProducts }).
 */
export async function POST(request: NextRequest) {
  return handleSync(request, 'addProductToCart');
}

/**
 * PATCH /api/cart/items
 * Updates quantity or store preference of items in cart (docs/08 §4.2).
 * Compatible with Terrific cartSyncHandler({ action: 'updateProductInCart', cartProducts }).
 */
export async function PATCH(request: NextRequest) {
  return handleSync(request, 'updateProductInCart');
}

/**
 * DELETE /api/cart/items
 * Removes items from cart (docs/08 §4.2).
 * Compatible with Terrific cartSyncHandler({ action: 'removeProductFromCart', cartProducts }).
 */
export async function DELETE(request: NextRequest) {
  return handleSync(request, 'removeProductFromCart');
}
