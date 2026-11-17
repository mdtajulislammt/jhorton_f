import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signAgeToken, AGE_COOKIE_NAME } from '@/server/age-session/crypto';

const cookieStore = new Map<string, string>();

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) => (cookieStore.has(name) ? { name, value: cookieStore.get(name)! } : undefined),
  }),
}));

import { isAgeVerified } from '@/server/age-session/verified';

describe('isAgeVerified (server-side owt_age check for TerrificEmbed, TASK-023)', () => {
  beforeEach(() => cookieStore.clear());

  it('returns true for a valid signed owt_age cookie', async () => {
    const { token } = await signAgeToken();
    cookieStore.set(AGE_COOKIE_NAME, token);
    expect(await isAgeVerified()).toBe(true);
  });

  it('returns false when the cookie is missing', async () => {
    expect(await isAgeVerified()).toBe(false);
  });

  it('returns false for a tampered signature', async () => {
    const { token } = await signAgeToken();
    const [nonce, exp, sig] = token.split('.');
    const flipped = (sig[0] === 'a' ? 'b' : 'a') + sig.slice(1);
    cookieStore.set(AGE_COOKIE_NAME, `${nonce}.${exp}.${flipped}`);
    expect(await isAgeVerified()).toBe(false);
  });

  it('returns false for an expired token', async () => {
    const { token } = await signAgeToken(undefined, -1000);
    cookieStore.set(AGE_COOKIE_NAME, token);
    expect(await isAgeVerified()).toBe(false);
  });
});
