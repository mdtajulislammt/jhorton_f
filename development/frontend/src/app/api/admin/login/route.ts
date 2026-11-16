import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import { adminLogin, AdminAuthError } from '@/server/admin/auth-service';
import { ADMIN_COOKIE_NAME, ADMIN_COOKIE_OPTIONS } from '@/server/admin/crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return fail('INVALID_CREDENTIALS', 'Email and password are required', 400);
    }

    const { user, token } = await adminLogin(email, password);

    const response = ok(
      { user },
      'Admin logged in successfully',
      200
    );

    response.cookies.set(ADMIN_COOKIE_NAME, token, ADMIN_COOKIE_OPTIONS);
    return response;
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return fail(err.code, err.message, err.status);
    }
    return fail('INTERNAL_SERVER_ERROR', 'Failed to process admin login', 500);
  }
}

