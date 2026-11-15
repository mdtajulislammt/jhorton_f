import { db } from '@/server/db';
import { ok, fail } from '@/server/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return ok({ db: 'up', status: 'healthy' });
  } catch (error: any) {
    return fail('DATABASE_CONNECTION_ERROR', error?.message || 'Database connection error', 503, [
      { field: 'db', message: 'Database is not reachable' },
    ]);
  }
}

