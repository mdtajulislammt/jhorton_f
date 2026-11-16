import crypto from 'crypto';

export const CART_COOKIE_NAME = 'owt_cart';
export const CART_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export const CART_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: CART_COOKIE_MAX_AGE * 1000,
};

/**
 * Generates a cryptographically secure 256-bit cart session token (64 hex characters).
 */
export function generateCartSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Extracts the cart session token from cookie store or request object.
 */
export function getCartSessionToken(request: any): string | null {
  if (!request) return null;
  if (typeof request === 'string') return request;
  if (request.cookies?.[CART_COOKIE_NAME]) {
    return request.cookies[CART_COOKIE_NAME];
  }
  if (request.cookies?.get) {
    return request.cookies.get(CART_COOKIE_NAME)?.value || null;
  }
  return request.headers?.['x-cart-token'] || null;
}
