export interface ErrorEnvelope {
  statusCode?: number;
  code?: string;
  message?: string | string[];
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  statusCode: number;
  code: string;
  errors?: Record<string, string[]>;
  isNetworkError: boolean;

  constructor(envelope: ErrorEnvelope & { statusCode: number }) {
    const message = Array.isArray(envelope.message) ? envelope.message[0] : envelope.message;
    super(message || 'Something went wrong. Please try again.');
    this.name = 'ApiError';
    this.statusCode = envelope.statusCode;
    this.code = envelope.code || `HTTP_${envelope.statusCode}`;
    this.errors = envelope.errors;
    this.isNetworkError = envelope.statusCode === 0;
  }
}

export function normalizeApiError(status: number, body: unknown, statusText = ''): ApiError {
  const envelope = typeof body === 'object' && body !== null ? body as ErrorEnvelope : {};
  return new ApiError({
    statusCode: status,
    code: envelope.code,
    message: envelope.message || (typeof body === 'string' ? body : statusText),
    errors: envelope.errors,
  });
}

export async function executeRequest<T>({ fetchImpl, url, options, onUnauthorized }: {
  fetchImpl: typeof fetch; url: string; options?: RequestInit; onUnauthorized?: () => void | Promise<void>;
}): Promise<T> {
  let response: Response;
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort();
  if (options?.signal?.aborted) controller.abort();
  else options?.signal?.addEventListener('abort', abortFromCaller, { once: true });
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    response = await fetchImpl(url, { ...options, signal: controller.signal });
  } catch {
    throw new ApiError({ statusCode: 0, code: 'NETWORK_ERROR', message: 'Unable to reach Orbit. Check your connection and try again.' });
  } finally {
    clearTimeout(timeout);
    options?.signal?.removeEventListener('abort', abortFromCaller);
  }
  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get('content-type') || '';
  let body: unknown = null;
  try { body = contentType.includes('application/json') ? await response.json() : await response.text(); } catch { body = null; }
  if (!response.ok) {
    if (response.status === 401) await onUnauthorized?.();
    throw normalizeApiError(response.status, body, response.statusText);
  }
  return body as T;
}
