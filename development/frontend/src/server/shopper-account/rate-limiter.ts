/**
 * Simple in-memory sliding window rate limiter for authentication endpoints
 * (e.g. login & password reset 5 requests / min per IP or key).
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

export function checkRateLimit(
  key: string,
  limit = 5,
  windowMs = 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  const record = rateLimitMap.get(key) || { timestamps: [] };
  // Keep only timestamps within window
  record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetMs = Math.max(0, oldest + windowMs - now);
    rateLimitMap.set(key, record);
    return {
      allowed: false,
      remaining: 0,
      resetMs,
    };
  }

  record.timestamps.push(now);
  rateLimitMap.set(key, record);

  return {
    allowed: true,
    remaining: limit - record.timestamps.length,
    resetMs: windowMs,
  };
}

export function resetRateLimit(key?: string): void {
  if (key) {
    rateLimitMap.delete(key);
  } else {
    rateLimitMap.clear();
  }
}

