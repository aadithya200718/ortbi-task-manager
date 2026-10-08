import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { authApi, type LoginInput, type RegisterInput } from '../lib/api/auth';
import { ApiError, setUnauthorizedHandler } from '../lib/api/client';
import { restoreSession, tokenStorage } from '../lib/session';
import type { AuthResponse, User } from '../lib/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionMessage: string | null;
  restoreError: string | null;
  clearSessionMessage(): void;
  retryRestore(): Promise<void>;
  login(input: LoginInput): Promise<AuthResponse>;
  register(input: RegisterInput): Promise<AuthResponse>;
  logout(): Promise<void>;
  refreshUser(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const expireSession = useCallback(async () => {
    await tokenStorage.clear();
    queryClient.clear();
    setUser(null);
    setToken(null);
    setRestoreError(null);
    setSessionMessage('Your session expired. Please sign in again.');
    router.replace('/login');
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(expireSession);
    return () => setUnauthorizedHandler(null);
  }, [expireSession]);

  const restore = useCallback(async () => {
    setIsLoading(true);
    setRestoreError(null);
    try {
      const session = await restoreSession(tokenStorage, authApi.getMe);
      setToken(session.token);
      setUser(session.user);
    } catch (error) {
      const storedToken = await tokenStorage.get();
      if (error instanceof ApiError && error.statusCode === 401) {
        setToken(null);
        setUser(null);
      } else if (storedToken) {
        setToken(storedToken);
        setUser(null);
        setRestoreError(error instanceof ApiError && error.isNetworkError
          ? 'Orbit could not reach the server. Your secure session is still on this device.'
          : 'Orbit could not validate your session. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void restore(); }, [restore]);

  const acceptAuth = (response: AuthResponse) => {
    setUser(response.user);
    setToken(response.accessToken);
    setSessionMessage(null);
    return response;
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    isAuthenticated: Boolean(user && token),
    sessionMessage,
    restoreError,
    clearSessionMessage: () => setSessionMessage(null),
    retryRestore: restore,
    login: async (input) => acceptAuth(await authApi.login(input)),
    register: async (input) => acceptAuth(await authApi.register(input)),
    logout: async () => {
      try { await authApi.logout(); } finally {
        queryClient.clear(); setUser(null); setToken(null); setSessionMessage(null); router.replace('/login');
      }
    },
    refreshUser: async () => setUser(await authApi.getMe()),
  }), [isLoading, queryClient, restore, restoreError, sessionMessage, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
