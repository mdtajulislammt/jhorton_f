import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getLiveShowsRoute } from '../../app/api/live-shows/route';
import { GET as getLiveShowByIdRoute } from '../../app/api/live-shows/[id]/route';

vi.mock('../../server/live-shows', () => ({
  listLiveShows: vi.fn(),
  getLiveShowById: vi.fn(),
}));

import { listLiveShows, getLiveShowById } from '../../server/live-shows';

describe('Live Shows API Route Handlers (GET /api/live-shows, GET /api/live-shows/[id])', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/live-shows', () => {
    it('returns 200 with list of live shows in standardized envelope', async () => {
      (listLiveShows as any).mockResolvedValue([
        {
          id: 'show-1',
          title: 'NY Live Drop',
          format: 'LIVE_SHOW',
          status: 'LIVE',
          scheduledAt: '2026-11-16T12:00:00.000Z',
          products: [],
        },
      ]);

      const req = new NextRequest('http://localhost:3000/api/live-shows?status=LIVE');
      const res = await getLiveShowsRoute(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.items).toHaveLength(1);
      expect(json.data.items[0].id).toBe('show-1');
      expect(listLiveShows).toHaveBeenCalledWith({
        status: 'LIVE',
        format: undefined,
        brand: undefined,
      });
    });

    it('returns 400 validation error for invalid query parameters', async () => {
      const req = new NextRequest('http://localhost:3000/api/live-shows?status=INVALID_STATUS');
      const res = await getLiveShowsRoute(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/live-shows/[id]', () => {
    it('returns 200 with live show details when show exists', async () => {
      (getLiveShowById as any).mockResolvedValue({
        id: 'show-1',
        title: 'NY Live Drop',
        format: 'LIVE_SHOW',
        status: 'LIVE',
      });

      const req = new NextRequest('http://localhost:3000/api/live-shows/show-1');
      const res = await getLiveShowByIdRoute(req, { params: { id: 'show-1' } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.id).toBe('show-1');
    });

    it('returns 404 when show is not found', async () => {
      (getLiveShowById as any).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/live-shows/non-existent');
      const res = await getLiveShowByIdRoute(req, { params: { id: 'non-existent' } });
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('NOT_FOUND');
    });
  });
});

