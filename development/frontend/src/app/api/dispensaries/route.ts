import { NextRequest } from 'next/server';
import { z } from 'zod';
import { findEligible, NoCoverageError } from '@/server/dispensaries';
import { fail, ok } from '@/server/http';

const querySchema = z.object({
  zip: z
    .string()
    .trim()
    .regex(/^\d{5}$/, 'ZIP code must be a 5-digit US postal code')
    .optional(),
  fulfillment: z.enum(['DELIVERY', 'PICKUP']).default('PICKUP'),
  brand: z.string().trim().min(1).optional(),
});

/**
 * GET /api/dispensaries?zip=11201&fulfillment=DELIVERY|PICKUP&brand=<slug-optional>
 *
 * Evaluates dispensary eligibility, store/delivery hours, and distance from ZIP centroid.
 * Matches docs/08-api-contract.md §6 and REQ-F-012, REQ-F-018.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      zip: searchParams.get('zip') || undefined,
      fulfillment: (searchParams.get('fulfillment') || 'PICKUP').toUpperCase(),
      brand: searchParams.get('brand') || undefined,
    });

    if (!parsed.success) {
      return fail(
        'VALIDATION_ERROR',
        'Invalid query parameters',
        400,
        parsed.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      );
    }

    const { zip, fulfillment, brand } = parsed.data;

    // Delivery requires a destination ZIP
    if (fulfillment === 'DELIVERY' && !zip) {
      return fail(
        'VALIDATION_ERROR',
        'ZIP code is required for DELIVERY fulfillment eligibility',
        400,
        [{ field: 'zip', message: 'ZIP code is required for delivery' }]
      );
    }

    const result = await findEligible({
      fulfillmentType: fulfillment,
      zip,
      brandSlug: brand,
    });

    return ok(result, 'OK');
  } catch (err: any) {
    if (err instanceof NoCoverageError || err.code === 'NO_COVERAGE') {
      return fail('NO_COVERAGE', err.message, 422, [
        { field: 'zip', message: 'ZIP outside NY 5-region coverage area' },
      ]);
    }

    console.error('[API /api/dispensaries] Error:', err);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to retrieve eligible dispensaries', 500);
  }
}

