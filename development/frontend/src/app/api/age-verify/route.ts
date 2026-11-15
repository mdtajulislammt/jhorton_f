import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, fail } from '@/server/http';
import {
  signAgeToken,
  verifyAgeToken,
  recordAgeVerificationSession,
  AGE_COOKIE_NAME,
  AGE_COOKIE_OPTIONS,
} from '@/server/age-session';

export const dynamic = 'force-dynamic';

const ageVerifySchema = z.object({
  confirmed21Plus: z.boolean(),
});

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || null;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => null);
    const parsed = ageVerifySchema.safeParse(rawBody);

    if (!parsed.success) {
      return fail('BAD_REQUEST', 'Invalid payload. confirmed21Plus boolean is required.', 400, [
        { field: 'confirmed21Plus', message: 'Must be a boolean' },
      ]);
    }

    const { confirmed21Plus } = parsed.data;
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent');

    if (!confirmed21Plus) {
      // User declined / is under 21
      const { nonce, expiresAt } = await signAgeToken(undefined, 24 * 60 * 60 * 1000);
      await recordAgeVerificationSession({
        nonce,
        confirmed: false,
        ip,
        userAgent,
        expiresAt,
      });

      const response = fail('FORBIDDEN', 'You must be 21 or older to enter Owtlet.', 403);
      response.cookies.delete(AGE_COOKIE_NAME);
      return response;
    }

    // User confirmed 21+
    const { token, nonce, expiresAt } = await signAgeToken();
    await recordAgeVerificationSession({
      nonce,
      confirmed: true,
      ip,
      userAgent,
      expiresAt,
    });

    const response = ok(
      {
        verified: true,
        expiresAt: expiresAt.toISOString(),
      },
      'Age verified'
    );

    response.cookies.set(AGE_COOKIE_NAME, token, {
      ...AGE_COOKIE_OPTIONS,
      expires: expiresAt,
    });

    return response;
  } catch (error: any) {
    console.error('[API /api/age-verify] Unexpected error:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to process age verification.', 500);
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AGE_COOKIE_NAME)?.value;
  const result = await verifyAgeToken(token);

  if (result.valid && result.expiresAt) {
    return ok({
      verified: true,
      expiresAt: result.expiresAt.toISOString(),
    });
  }

  return ok({
    verified: false,
    reason: result.reason || 'MISSING',
  });
}

