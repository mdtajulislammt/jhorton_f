import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, fail } from '@/server/http';
import { getProductBySlug } from '@/server/products';

const paramsSchema = z.object({
  slug: z.string().min(1).max(150),
});

const querySchema = z.object({
  zip: z.string().regex(/^\d{5}$/, 'ZIP code must be 5 digits').optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const paramsResult = paramsSchema.safeParse(params);
    if (!paramsResult.success) {
      return fail('VALIDATION_ERROR', 'Invalid product slug', 400);
    }

    const zipParam = request.nextUrl.searchParams.get('zip');
    const queryResult = querySchema.safeParse({ zip: zipParam || undefined });
    if (!queryResult.success) {
      return fail(
        'VALIDATION_ERROR',
        'Invalid ZIP code query parameter',
        400,
        queryResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      );
    }

    const product = await getProductBySlug(paramsResult.data.slug, {
      zip: queryResult.data.zip,
    });

    if (!product) {
      return fail('NOT_FOUND', `Product '${paramsResult.data.slug}' not found`, 404);
    }

    return ok(product, 'OK');
  } catch (error: any) {
    console.error(`Failed to get product ${params?.slug}:`, error);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to retrieve product details', 500);
  }
}

