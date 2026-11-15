import { describe, it, expect } from 'vitest';
import { ok, fail } from '../server/http';

describe('HTTP Envelope Helpers', () => {
  it('ok() returns a standard 200 success envelope', async () => {
    const res = ok({ db: 'up' }, 'Healthy');
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual({ db: 'up' });
    expect(json.message).toBe('Healthy');
    expect(json.timestamp).toBeDefined();
  });

  it('fail() returns a standard error envelope', async () => {
    const res = fail('BAD_REQUEST', 'Invalid payload', 400, [{ field: 'email', message: 'Required' }]);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('BAD_REQUEST');
    expect(json.error.message).toBe('Invalid payload');
    expect(json.error.details).toHaveLength(1);
    expect(json.timestamp).toBeDefined();
  });
});

