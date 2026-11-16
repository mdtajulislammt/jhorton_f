import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, fail } from '@/server/http';
import { getBrandStorefront, BrandNotFoundError } from '@/server/brands';

const paramsSchema = z.object({
  slug: z.string().min(1).max(100),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const parsed = paramsSchema.safeParse(params);
    if (!parsed.success) {
      return fail('VALIDATION_ERROR', 'Invalid brand slug parameter', 400);
    }

    const storefront = await getBrandStorefront(parsed.data.slug);
    return ok(storefront, 'Brand storefront retrieved successfully');
  } catch (error: any) {
    if (error instanceof BrandNotFoundError) {
      return fail('NOT_FOUND', error.message, 404);
    }
    console.error(`Failed to get brand storefront for ${params?.slug}:`, error);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to retrieve brand storefront', 500);
  }
}

