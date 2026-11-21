import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isAgeVerified, AGE_COOKIE_NAME } from '@/lib/session';

const cookieStore = new Map<string, string>();

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) => (cookieStore.has(name) ? { name, value: cookieStore.get(name)! } : undefined),
  }),
}));

async function signAgeToken(ttlMs = 30 * 24 * 60 * 60 * 1000): Promise<{ token: string }> {
  const encoder = new TextEncoder();
  const secret = 'owtlet_age_cookie_default_secret_min_32_chars';
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const nonce = Array.from(nonceBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  const exp = Date.now() + ttlMs;
  const payload = `${nonce}.${exp}`;
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const sigHex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return { token: `${payload}.${sigHex}` };
}

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
    const { token } = await signAgeToken(-1000);
    cookieStore.set(AGE_COOKIE_NAME, token);
    expect(await isAgeVerified()).toBe(false);
  });
});
