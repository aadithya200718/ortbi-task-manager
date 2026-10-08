import { apiClient, setStoredToken, clearStoredToken } from './client';
import { AuthResponse, User } from '../../types';

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const authApi = {
  async register(data: RegisterInput): Promise<AuthResponse> {
    const res = await apiClient<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.accessToken) {
      setStoredToken(res.accessToken);
    }
    return res;
  },

  async login(data: LoginInput): Promise<AuthResponse> {
    const res = await apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.accessToken) {
      setStoredToken(res.accessToken);
    }
    return res;
  },

  async getMe(): Promise<User> {
    return apiClient<User>('/auth/me', {
      method: 'GET',
    });
  },

  async logout(): Promise<void> {
    try {
      await apiClient<{ message: string }>('/auth/logout', {
        method: 'POST',
      });
    } finally {
      clearStoredToken();
    }
  },
};
