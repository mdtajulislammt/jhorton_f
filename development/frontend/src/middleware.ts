import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAgeToken, AGE_COOKIE_NAME } from './server/age-session/crypto';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from './server/admin/crypto';

// Public endpoints that do not require 21+ age cookie
const PUBLIC_BYPASS_PREFIXES = [
  '/age-gate',
  '/api/health',
  '/api/age-verify',
  '/api/webhooks',
  '/_next',
  '/favicon.ico',
];

// Account routes that are accessible without an existing session
const PUBLIC_ACCOUNT_ROUTES = [
  '/account/login',
  '/account/register',
  '/account/forgot-password',
  '/account/reset-password',
];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Bypass public assets, health, age verification endpoint, webhooks
  if (PUBLIC_BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // 2. Admin routes guard: requires owt_admin session cookie (independent of consumer age gate)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const isLoginEndpoint = pathname === '/admin/login' || pathname === '/api/admin/login';
    const adminResult = await verifyAdminToken(adminToken);

    if (!adminResult.valid && !isLoginEndpoint) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Admin authorization required.',
            },
            timestamp: new Date().toISOString(),
          },
          { status: 401 }
        );
      }
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const res = NextResponse.redirect(loginUrl);
      if (adminToken) res.cookies.delete(ADMIN_COOKIE_NAME);
      return res;
    }

    if (adminResult.valid && pathname === '/admin/login') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
  }

  // 3. 21+ Age Attestation Guard (owt_age HMAC-signed cookie)
  // Evaluated before any storefront pages, products, pricing, or video render
  const ageToken = request.cookies.get(AGE_COOKIE_NAME)?.value;
  const ageResult = await verifyAgeToken(ageToken);

  if (!ageResult.valid) {
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.json(
        {
          success: false,
          error: {
            code: 'AGE_GATE_REQUIRED',
            message: 'Adult-use 21+ age verification required to access cannabis services.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 451 }
      );
      if (ageToken) {
        // Clear invalid / expired / tampered cookie
        response.cookies.delete(AGE_COOKIE_NAME);
      }
      return response;
    }

    // Redirect storefront page requests to /age-gate
    const ageGateUrl = new URL('/age-gate', request.url);
    const destination = pathname + (search || '');
    ageGateUrl.searchParams.set('next', destination);
    ageGateUrl.searchParams.set('redirect', destination);

    const redirectResponse = NextResponse.redirect(ageGateUrl);
    if (ageToken) {
      redirectResponse.cookies.delete(AGE_COOKIE_NAME);
    }
    return redirectResponse;
  }

  // 4. Shopper Account Guard (/account routes)
  if (pathname.startsWith('/account')) {
    const isPublicAccount = PUBLIC_ACCOUNT_ROUTES.some((route) => pathname.startsWith(route));
    const shopperSession = request.cookies.get('owt_shopper')?.value;

    if (!shopperSession && !isPublicAccount) {
      const loginUrl = new URL('/account/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (shopperSession && isPublicAccount) {
      return NextResponse.redirect(new URL('/account/profile', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - static files (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
