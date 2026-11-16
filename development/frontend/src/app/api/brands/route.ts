import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import { listActiveBrands } from '@/server/brands';

export async function GET(request: NextRequest) {
  try {
    const brands = await listActiveBrands();
    return ok({ items: brands }, 'Active brands retrieved successfully');
  } catch (error: any) {
    console.error('Failed to list brands:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Failed to retrieve brands', 500);
  }
}

