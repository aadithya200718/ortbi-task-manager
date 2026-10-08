import Constants from 'expo-constants';
import { tokenStorage } from '../session';
import { executeRequest } from './core';

export { ApiError } from './core';

type UnauthorizedHandler = () => void | Promise<void>;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

export function getApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl;
  return String(configured || 'http://10.0.2.2:4000/api').replace(/\/$/, '');
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await tokenStorage.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`;

  return executeRequest<T>({
    fetchImpl: fetch,
    url: `${getApiBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`,
    options: { ...options, headers },
    onUnauthorized: async () => { await tokenStorage.clear(); await onUnauthorized?.(); },
  });
}

export function toQueryString<T extends object>(params: T): string {
  const query = Object.entries(params as Record<string, string | number | undefined>).filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join('&');
  return query ? `?${query}` : '';
}
