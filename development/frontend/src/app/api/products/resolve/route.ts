import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, fail } from '@/server/http';
import { resolveProduct } from '@/server/products';

const resolveQuerySchema = z
  .object({
    productId: z.string().optional(),
    terrificProductId: z.string().optional(),
    externalId: z.string().optional(),
    sku: z.string().optional(),
  })
  .refine(
    (data) => !!(data.productId || data.terrificProductId || data.externalId || data.sku),
    {
      message: 'At least one identifier (productId, terrificProductId, externalId, or sku) must be provided',
    }
  );

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parseResult = resolveQuerySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return fail(
        'VALIDATION_ERROR',
        'Invalid resolve query parameters',
        400,
        parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      );
    }

    const product = await resolveProduct(parseResult.data);

    if (!product) {
      return fail(
        'UNMAPPED_PRODUCT',
        'Identifier not mapped to an active Owtlet cannabis product',
        404,
        [{ query: parseResult.data }]
      );
    }

    return ok(product, 'Product resolved successfully');
  } catch (error: any) {
    console.error('Failed to resolve product:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to resolve product identifier', 500);
  }
}

