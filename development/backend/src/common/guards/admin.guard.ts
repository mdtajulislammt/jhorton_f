import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ADMIN_COOKIE_NAME, verifyAdminToken } from '../../server/admin/crypto';

export const IS_PUBLIC_ADMIN_KEY = 'isPublicAdmin';
export const PublicAdmin = () => SetMetadata(IS_PUBLIC_ADMIN_KEY, true);

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token =
      request.cookies?.[ADMIN_COOKIE_NAME] ||
      (request.headers['x-admin-token'] as string) ||
      (request.headers['authorization']?.startsWith('Bearer ')
        ? request.headers['authorization'].slice(7)
        : undefined);

    if (!token) {
      throw new UnauthorizedException({
        success: false,
        statusCode: 401,
        error: { code: 'UNAUTHORIZED', message: 'Admin authentication required' },
        timestamp: new Date().toISOString(),
      });
    }

    const verification = await verifyAdminToken(token);
    if (!verification.valid) {
      throw new UnauthorizedException({
        success: false,
        statusCode: 401,
        error: {
          code: 'UNAUTHORIZED',
          message: verification.reason === 'EXPIRED' ? 'Admin session expired' : 'Invalid admin token',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Attach admin info to request
    (request as any).admin = {
      userId: verification.userId,
      role: verification.role,
    };

    return true;
  }
}

