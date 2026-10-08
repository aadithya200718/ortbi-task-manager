import { apiClient } from './client';
import { tokenStorage } from '../session';
import type { AuthResponse, User } from '../types';

export interface LoginInput { email: string; password: string }
export interface RegisterInput extends LoginInput { fullName: string }

async function acceptAuth(response: AuthResponse): Promise<AuthResponse> {
  await tokenStorage.set(response.accessToken);
  return response;
}

export const authApi = {
  async login(input: LoginInput) {
    return acceptAuth(await apiClient<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(input) }));
  },
  async register(input: RegisterInput) {
    return acceptAuth(await apiClient<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(input) }));
  },
  getMe: () => apiClient<User>('/auth/me'),
  async logout() {
    try { await apiClient('/auth/logout', { method: 'POST' }); } finally { await tokenStorage.clear(); }
  },
};
