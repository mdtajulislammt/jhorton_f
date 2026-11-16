import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import {
  getOrCreateCart,
  clearCart,
  getCartBySessionToken,
} from '@/server/cart';
import {
  getCartSessionToken,
  attachCartCookie,
} from '@/server/cart/session';

/**
 * GET /api/cart
 * Retrieves the current cart from the owt_cart cookie session.
 * If expired, returns 410 CART_EXPIRED and issues a new empty cart session.
 * (docs/08 §4.1)
 */
export async function GET(request: NextRequest) {
  try {
    const sessionToken = getCartSessionToken(request);

    if (sessionToken) {
      const { cart, isExpired } = await getCartBySessionToken(sessionToken);

      if (isExpired) {
        // Issue fresh replacement cart
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

      if (cart) {
        const res = ok(cart, 'Cart retrieved');
        return res;
      }
    }

    // No existing cart session — create a fresh one
    const { cart, sessionToken: newToken } = await getOrCreateCart(null);
    const res = ok(cart, 'Cart initialized');
    attachCartCookie(res, newToken);
    return res;
  } catch (error) {
    console.error('Failed to get cart:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to retrieve cart', 500);
  }
}

/**
 * DELETE /api/cart
 * Clears all items from the current cart.
 * (docs/08 §4.3)
 */
export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = getCartSessionToken(request);

    if (!sessionToken) {
      const { cart, sessionToken: newToken } = await getOrCreateCart(null);
      const res = ok(cart, 'Cart is empty');
      attachCartCookie(res, newToken);
      return res;
    }

    const updatedCart = await clearCart(sessionToken);
    return ok(updatedCart, 'Cart cleared');
  } catch (error) {
    console.error('Failed to clear cart:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to clear cart', 500);
  }
}
