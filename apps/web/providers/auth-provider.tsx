'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { User, AuthResponse } from '../types';
import { authApi, LoginInput, RegisterInput } from '../lib/api/auth';
import {
  getStoredToken,
  setStoredToken,
  clearStoredToken,
  setOnUnauthorizedCallback,
} from '../lib/api/client';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginInput) => Promise<AuthResponse>;
  register: (data: RegisterInput) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeUser(u: User): User {
  return {
    ...u,
    name: u.fullName || u.name || 'User',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleUnauthorized = useCallback(() => {
    setUser(null);
    setToken(null);
    clearStoredToken();
    router.push('/login?expired=true');
  }, [router]);

  useEffect(() => {
    setOnUnauthorizedCallback(handleUnauthorized);
    return () => setOnUnauthorizedCallback(null);
  }, [handleUnauthorized]);

  const restoreSession = useCallback(async () => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await authApi.getMe();
      setUser(normalizeUser(currentUser));
      setToken(storedToken);
    } catch {
      clearStoredToken();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (data: LoginInput): Promise<AuthResponse> => {
    const res = await authApi.login(data);
    const normalized = normalizeUser(res.user);
    setUser(normalized);
    setToken(res.accessToken);
    setStoredToken(res.accessToken);
    return { ...res, user: normalized };
  };

  const register = async (data: RegisterInput): Promise<AuthResponse> => {
    const res = await authApi.register(data);
    const normalized = normalizeUser(res.user);
    setUser(normalized);
    setToken(res.accessToken);
    setStoredToken(res.accessToken);
    return { ...res, user: normalized };
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setToken(null);
      clearStoredToken();
      router.push('/login');
    }
  };

  const refreshUser = async (): Promise<void> => {
    const currentUser = await authApi.getMe();
    setUser(normalizeUser(currentUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
