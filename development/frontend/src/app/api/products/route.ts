import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, fail } from '@/server/http';
import { listProducts } from '@/server/products';
import { StrainType } from '@prisma/client';

const listQuerySchema = z.object({
  category: z.string().min(1).max(100).optional(),
  strainType: z.preprocess(
    (v) => (typeof v === 'string' ? v.toUpperCase() : v),
    z.nativeEnum(StrainType).optional()
  ),
  minThc: z.coerce.number().min(0).max(100).optional(),
  maxThc: z.coerce.number().min(0).max(100).optional(),
  brand: z.string().min(1).max(100).optional(),
  q: z.string().max(100).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parseResult = listQuerySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return fail(
        'VALIDATION_ERROR',
        'Invalid product filter parameters',
        400,
        parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      );
    }

    const { category, strainType, minThc, maxThc, brand, q, cursor, limit } = parseResult.data;

    const result = await listProducts({
      category,
      strainType,
      minThc,
      maxThc,
      brand,
      q,
      cursor,
      limit,
    });

    return ok(result, 'OK');
  } catch (error: any) {
    console.error('Failed to list products:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to retrieve products from catalog', 500);
  }
}

