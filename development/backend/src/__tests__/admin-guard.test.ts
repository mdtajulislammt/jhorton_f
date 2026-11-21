import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminGuard } from '../common/guards/admin.guard';
import { signAdminToken } from '../server/admin/crypto';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new AdminGuard(reflector);
  });

  function createMockContext(headers: Record<string, string> = {}, cookies: Record<string, string> = {}, isPublic = false) {
    const request = {
      headers,
      cookies,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  it('allows access to public endpoints (e.g. login/logout)', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const context = createMockContext();
    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
  });

  it('rejects requests with no admin token with 401', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const context = createMockContext();
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects requests with invalid or expired admin token with 401', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const context = createMockContext({}, { owt_admin: 'invalid.token.structure' });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('allows requests with valid signed admin cookie', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const { token } = await signAdminToken({ userId: 'admin-123', role: 'ADMIN' });
    const context = createMockContext({}, { owt_admin: token });
    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
  });

  it('allows requests with valid x-admin-token header', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const { token } = await signAdminToken({ userId: 'admin-123', role: 'ADMIN' });
    const context = createMockContext({ 'x-admin-token': token });
    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
  });
});
