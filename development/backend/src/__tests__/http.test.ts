import { describe, it, expect } from 'vitest';
import { ok, fail } from '../server/http';

describe('HTTP Envelope Helpers', () => {
  it('ok() returns a standard success envelope', () => {
    const res = ok({ db: 'up' }, 'Healthy');

    expect(res.success).toBe(true);
    expect(res.data).toEqual({ db: 'up' });
    expect(res.message).toBe('Healthy');
    expect(res.timestamp).toBeDefined();
  });

  it('fail() returns a standard error envelope', () => {
    const res = fail('BAD_REQUEST', 'Invalid payload', [{ field: 'email', message: 'Required' }]);

    expect(res.success).toBe(false);
    expect(res.error.code).toBe('BAD_REQUEST');
    expect(res.error.message).toBe('Invalid payload');
    expect(res.error.details).toHaveLength(1);
    expect(res.timestamp).toBeDefined();
  });
});
