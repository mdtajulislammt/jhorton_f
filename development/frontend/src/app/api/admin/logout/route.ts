import { NextRequest } from 'next/server';
import { ok } from '@/server/http';
import { ADMIN_COOKIE_NAME } from '@/server/admin/crypto';

export async function POST(request: NextRequest) {
  const response = ok({ loggedOut: true }, 'Admin logged out successfully', 200);
  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}

