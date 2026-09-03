import type { ApiResponse } from '@healthathon/shared';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export class ApiClientError extends Error {
  public code: string;
  public details?: unknown[];

  constructor(message: string, code = 'UNKNOWN_ERROR', details?: unknown[]) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.details = details;
  }
}

export const apiClient = {
  async get<T>(endpoint: string, token?: string): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const response = await fetch(`${BASE_URL}${cleanEndpoint}`, {
      method: 'GET',
      headers,
    });

    const data: ApiResponse<T> = await response.json();

    if (!data.success) {
      throw new ApiClientError(
        data.error.message || 'API request failed',
        data.error.code,
        data.error.details
      );
    }

    return data.data;
  },

  async post<T, B = unknown>(endpoint: string, body: B, token?: string): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const response = await fetch(`${BASE_URL}${cleanEndpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data: ApiResponse<T> = await response.json();

    if (!data.success) {
      throw new ApiClientError(
        data.error.message || 'API request failed',
        data.error.code,
        data.error.details
      );
    }

    return data.data;
  },
};
