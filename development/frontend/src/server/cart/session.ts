import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const CART_COOKIE_NAME = 'owt_cart';
export const CART_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Generates a cryptographically secure 256-bit cart session token (64 hex characters).
 */
export function generateCartSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Extracts the cart session token from request cookies.
 */
export function getCartSessionToken(request: NextRequest): string | null {
  return request.cookies.get(CART_COOKIE_NAME)?.value || null;
}

/**
 * Attaches the owt_cart session cookie to the outgoing response.
 */
export function attachCartCookie(
  response: NextResponse,
  sessionToken: string
): void {
  response.cookies.set(CART_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CART_COOKIE_MAX_AGE,
  });
}
