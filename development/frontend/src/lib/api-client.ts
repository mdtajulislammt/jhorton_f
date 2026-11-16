/**
 * Universal API Client with automatic JWT injection, error handling, and 401 interception.
 * Follows technical contracts defined in `docs/08-api-contract.md`.
 */

import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  code?: string;
  message: string;
  errors?: any;
  timestamp: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return Cookies.get('token') || localStorage.getItem('token') || null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 451 Unavailable For Legal Reasons (Age verification required)
      if (response.status === 451) {
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/age-gate')) {
          window.location.href = `/age-gate?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
      }

      // Handle 401 Unauthorized (JWT expired / invalid)
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          Cookies.remove('token');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/admin/login')) {
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          }
        }
      }

      const data = await response.json();

      if (!response.ok) {
        const error: ApiError = {
          success: false,
          statusCode: response.status,
          code: data.error?.code,
          message: data.error?.message || data.message || `Request failed with status ${response.status}`,
          errors: data.error?.details || data.errors,
          timestamp: data.timestamp || new Date().toISOString(),
        };
        throw error;
      }

      return data as ApiResponse<T>;
    } catch (err: any) {
      if (err.statusCode) {
        throw err;
      }
      // Network or unhandled failure
      const fallbackError: ApiError = {
        success: false,
        statusCode: 500,
        message: err.message || 'Network connection failed. Please check your connection.',
        timestamp: new Date().toISOString(),
      };
      throw fallbackError;
    }
  }

  get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

