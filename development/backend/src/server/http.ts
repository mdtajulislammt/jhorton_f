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
 * Returns a standardized success response object matching docs/architecture-spine.md §2.1
 */
export function ok<T>(data: T, message = 'Operation completed'): ApiSuccessEnvelope<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Returns a standardized error response object matching docs/architecture-spine.md §2.1
 */
export function fail(
  code: string,
  message: string,
  details: ApiErrorDetail[] | unknown[] = []
): ApiErrorEnvelope {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };
}
