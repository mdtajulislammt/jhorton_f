import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import { getAdminFromToken, AdminAuthError } from '@/server/admin/auth-service';
import { ADMIN_COOKIE_NAME } from '@/server/admin/crypto';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const user = await getAdminFromToken(token);
    return ok({ user }, 'Admin session verified', 200);
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('UNAUTHORIZED', 'Invalid admin session', 401);
  }
}

