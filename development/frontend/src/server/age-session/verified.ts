import { cookies } from 'next/headers';
import { AGE_COOKIE_NAME, verifyAgeToken } from './crypto';

/**
 * Server-side 21+ check for Server Components.
 *
 * The `owt_age` cookie is HttpOnly (AC-AGE-03), so client code cannot read it.
 * Pages verify it here (same HMAC check as the middleware) and pass the result
 * down, e.g. to `TerrificEmbed` so the SDK is only injected for verified visitors.
 */
export async function isAgeVerified(): Promise<boolean> {
  const token = cookies().get(AGE_COOKIE_NAME)?.value;
  const result = await verifyAgeToken(token);
  return result.valid;
}
