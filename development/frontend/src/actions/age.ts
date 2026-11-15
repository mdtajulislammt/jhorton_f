'use server';

import { cookies, headers } from 'next/headers';
import {
  signAgeToken,
  recordAgeVerificationSession,
  AGE_COOKIE_NAME,
  AGE_COOKIE_OPTIONS,
} from '@/server/age-session';

export interface ConfirmAgeResult {
  success: boolean;
  verified?: boolean;
  expiresAt?: string;
  error?: string;
}

/**
 * Server Action to attest 21+ age or decline.
 * Sets the HMAC-signed owt_age cookie and records audit log.
 */
export async function confirmAge(confirmed21Plus: boolean): Promise<ConfirmAgeResult> {
  const headerList = headers();
  const forwarded = headerList.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : headerList.get('x-real-ip');
  const userAgent = headerList.get('user-agent');

  if (!confirmed21Plus) {
    const { nonce, expiresAt } = await signAgeToken(undefined, 24 * 60 * 60 * 1000);
    await recordAgeVerificationSession({
      nonce,
      confirmed: false,
      ip,
      userAgent,
      expiresAt,
    });

    cookies().delete(AGE_COOKIE_NAME);
    return {
      success: false,
      error: 'You must be 21 or older to enter Owtlet.',
    };
  }

  const { token, nonce, expiresAt } = await signAgeToken();
  await recordAgeVerificationSession({
    nonce,
    confirmed: true,
    ip,
    userAgent,
    expiresAt,
  });

  cookies().set(AGE_COOKIE_NAME, token, {
    ...AGE_COOKIE_OPTIONS,
    expires: expiresAt,
  });

  return {
    success: true,
    verified: true,
    expiresAt: expiresAt.toISOString(),
  };
}
