import crypto from 'crypto';
import { prisma } from '../db';

/**
 * Generates an order number matching the format 'OWT-xxxxxx' (e.g. 'OWT-100245').
 * Retries if a collision is detected.
 */
export async function generateOrderNumber(client: typeof prisma = prisma): Promise<string> {
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate a 6-digit numeric string (100000 - 999999)
    const randomNum = crypto.randomInt(100000, 1000000);
    const candidate = `OWT-${randomNum}`;

    const existing = await client.order.findUnique({
      where: { orderNumber: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  // Fallback with timestamp suffix if all numeric attempts collide
  const hex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `OWT-${hex}`;
}

