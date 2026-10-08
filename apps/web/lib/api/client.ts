import { ApiErrorEnvelope } from '../../types';

export const TOKEN_STORAGE_KEY = 'orbit_access_token';

export class ApiError extends Error {
  statusCode: number;
  code: string;
  errors?: Record<string, string[]>;

  constructor(envelope: ApiErrorEnvelope) {
    const primaryMessage = Array.isArray(envelope.message)
      ? envelope.message[0] || 'An unexpected error occurred'
      : envelope.message || 'An unexpected error occurred';
    super(primaryMessage);
    this.name = 'ApiError';
    this.statusCode = envelope.statusCode;
    this.code = envelope.code || 'UNKNOWN_ERROR';
    this.errors = envelope.errors;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // SessionStorage unavailable or full
  }
}

export function clearStoredToken(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // SessionStorage unavailable
  }
}

let onUnauthorizedCallback: (() => void) | null = null;

export function setOnUnauthorizedCallback(cb: (() => void) | null) {
  onUnauthorizedCallback = cb;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getStoredToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new ApiError({
      statusCode: 0,
      code: 'NETWORK_ERROR',
      message: 'Unable to connect to the server. Please check your internet connection.',
    });
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  let body: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      body = await response.json();
    } catch {
      body = null;
    }
  } else {
    try {
      body = await response.text();
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredToken();
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }

    const envelope: ApiErrorEnvelope = {
      statusCode: response.status,
      code: typeof body === 'object' && body?.code ? body.code : `HTTP_${response.status}`,
      message:
        typeof body === 'object' && body?.message
          ? body.message
          : typeof body === 'string' && body.length > 0
            ? body
            : response.statusText || 'Request failed',
      errors: typeof body === 'object' && body?.errors ? body.errors : undefined,
    };

    throw new ApiError(envelope);
  }

  return body as T;
}
