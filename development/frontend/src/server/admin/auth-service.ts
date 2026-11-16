import * as argon2 from 'argon2';
import { prisma } from '../db';
import { signAdminToken, verifyAdminToken, ADMIN_COOKIE_NAME, ADMIN_COOKIE_OPTIONS } from './crypto';

export class AdminAuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 401
  ) {
    super(message);
    this.name = 'AdminAuthError';
  }
}

export interface AdminUserDto {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export async function adminLogin(
  email: string,
  password: string
): Promise<{ user: AdminUserDto; token: string; expiresAt: Date }> {
  if (!email || !password) {
    throw new AdminAuthError('INVALID_CREDENTIALS', 'Email and password are required', 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user || !user.isActive) {
    throw new AdminAuthError('INVALID_CREDENTIALS', 'Invalid administrative credentials', 401);
  }

  if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
    throw new AdminAuthError('FORBIDDEN', 'Administrative privilege required', 403);
  }

  const isValidPassword = await argon2.verify(user.passwordHash, password);
  if (!isValidPassword) {
    throw new AdminAuthError('INVALID_CREDENTIALS', 'Invalid administrative credentials', 401);
  }

  const { token, expiresAt } = await signAdminToken({
    userId: user.id,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    token,
    expiresAt,
  };
}

export async function getAdminFromToken(token?: string): Promise<AdminUserDto> {
  const result = await verifyAdminToken(token);
  if (!result.valid || !result.userId) {
    throw new AdminAuthError('UNAUTHORIZED', 'Invalid or expired administrative session', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: result.userId },
  });

  if (!user || !user.isActive || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
    throw new AdminAuthError('UNAUTHORIZED', 'Administrative account inactive or revoked', 401);
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

