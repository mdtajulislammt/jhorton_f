import { cookies, headers } from 'next/headers';

const BACKEND_INTERNAL_URL =
  process.env.INTERNAL_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://127.0.0.1:4000';

export async function serverFetch<T = any>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${BACKEND_INTERNAL_URL}${normalizedPath.startsWith('/api') ? normalizedPath : `/api${normalizedPath}`}`;

  const incomingHeaders = headers();
  const cookieStore = cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  const mergedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    ...(incomingHeaders.get('x-forwarded-for')
      ? { 'x-forwarded-for': incomingHeaders.get('x-forwarded-for')! }
      : {}),
    ...(incomingHeaders.get('x-real-ip')
      ? { 'x-real-ip': incomingHeaders.get('x-real-ip')! }
      : {}),
    ...((init?.headers as Record<string, string>) || {}),
  };

  const res = await fetch(url, {
    ...init,
    headers: mergedHeaders,
    cache: init?.cache ?? 'no-store',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const error = new Error(
      errorData?.error?.message ||
        errorData?.message ||
        `Backend request failed with status ${res.status}`
    );
    (error as any).status = res.status;
    (error as any).code = errorData?.error?.code || errorData?.code;
    (error as any).details = errorData?.error?.details || errorData?.details;
    throw error;
  }

  const json = await res.json();
  // NestJS standard wraps response in { success: true, data: ... } or { data: ... }
  return (json?.data !== undefined ? json.data : json) as T;
}
