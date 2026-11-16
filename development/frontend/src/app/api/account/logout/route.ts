import { NextRequest } from 'next/server';
import { ok } from '@/server/http';
import { SHOPPER_COOKIE_NAME } from '@/server/shopper-account';

/**
 * POST /api/account/logout
 * Clears the owt_shopper session cookie.
 * (docs/08 §13)
 */
export async function POST(_request: NextRequest) {
  const response = ok({ success: true }, 'Logged out successfully', 200);
  response.cookies.delete(SHOPPER_COOKIE_NAME);
  return response;
}

