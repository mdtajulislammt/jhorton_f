import { NextResponse } from 'next/server';

export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  message: string;
  timestamp: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  [key: string]: unknown;
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[] | unknown[];
  };
  timestamp: string;
}

/**
 * Returns a standardized success response matching docs/architecture-spine.md §2.1
 */
export function ok<T>(data: T, message = 'Operation completed', status = 200): NextResponse<ApiSuccessEnvelope<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Returns a standardized error response matching docs/architecture-spine.md §2.1
 */
export function fail(
  code: string,
  message: string,
  status = 400,
  details: ApiErrorDetail[] | unknown[] = []
): NextResponse<ApiErrorEnvelope> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

