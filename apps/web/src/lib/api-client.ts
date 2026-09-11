import type { ApiResponse } from '@healthathon/shared';

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '/api/v1';

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
  async request<T>(endpoint: string, options: RequestInit = {}, token?: string): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const cleanBase = BASE_URL.replace(/\/+$/, '');

    let response: Response;
    try {
      response = await fetch(`${cleanBase}${cleanEndpoint}`, {
        ...options,
        headers,
      });
    } catch (netErr) {
      throw new ApiClientError(
        'Koneksi jaringan gagal. Pastikan backend API aktif.',
        'NETWORK_OFFLINE'
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      throw new ApiClientError(
        `Server mengembalikan respons non-JSON (${response.status}): ${text.slice(0, 100)}`,
        `HTTP_${response.status}`
      );
    }

    let data: ApiResponse<T>;
    try {
      data = await response.json();
    } catch {
      throw new ApiClientError(
        'Format data respons JSON tidak valid dari server.',
        'MALFORMED_JSON'
      );
    }

    if (!response.ok || !data.success) {
      const err = (data as any)?.error || {
        message: `Permintaan API gagal dengan status ${response.status}`,
        code: `HTTP_${response.status}`,
      };
      throw new ApiClientError(err.message, err.code, err.details);
    }

    return data.data;
  },

  get<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, token);
  },

  post<T, B = unknown>(endpoint: string, body: B, token?: string): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      token
    );
  },
};

