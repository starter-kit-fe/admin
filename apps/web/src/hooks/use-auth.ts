'use client';

import http from '@/lib/request';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const TOKEN_STORAGE_KEY = 'token';
export const AUTH_QUERY_KEY = ['auth', 'me'] as const;
const AUTH_TOKEN_EVENT = 'auth-token-change';

export interface AuthUser {
  userId: number;
  deptId?: number | null;
  userName: string;
  nickName: string;
  email: string;
  phonenumber: string;
  sex: string;
  avatar: string;
  status: string;
  remark?: string | null;
}

export interface AuthResponse {
  code: number;
  msg: string | null;
  permissions: string[];
  roles: string[];
  user: AuthUser;
}

export function emitAuthTokenChange() {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new Event(AUTH_TOKEN_EVENT));
}

export function useAuthStatus() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [isTokenLoaded, setIsTokenLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const readToken = () => {
      const value = window.localStorage.getItem(TOKEN_STORAGE_KEY);
      setToken(value);
      http.updateToken(value);
      setIsTokenLoaded(true);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== TOKEN_STORAGE_KEY) {
        return;
      }
      readToken();
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    };

    const handleManualChange = () => {
      readToken();
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    };

    readToken();

    window.addEventListener('storage', handleStorage);
    window.addEventListener(
      AUTH_TOKEN_EVENT,
      handleManualChange as EventListener,
    );

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(
        AUTH_TOKEN_EVENT,
        handleManualChange as EventListener,
      );
    };
  }, [queryClient]);

  useEffect(() => {
    if (!isTokenLoaded) {
      return;
    }
    if (!token) {
      http.updateToken(null);
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
      return;
    }
    http.updateToken(token);
  }, [token, isTokenLoaded, queryClient]);

  const authQuery = useQuery<AuthResponse | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      const response = await http.get<AuthResponse>('/v1/auth/me');
      if (response.code !== 200 || !response.user) {
        return null;
      }
      return response;
    },
    enabled: isTokenLoaded && Boolean(token),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: false,
  });

  const logout = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    http.updateToken(null);
    setToken(null);
    emitAuthTokenChange();
    queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
  }, [queryClient]);

  const isLoading = useMemo(() => {
    if (!isTokenLoaded) {
      return true;
    }
    if (!token) {
      return false;
    }
    return authQuery.isLoading || authQuery.isFetching;
  }, [isTokenLoaded, token, authQuery.isLoading, authQuery.isFetching]);

  const isAuthenticated = Boolean(token && authQuery.data?.user);

  return {
    token,
    logout,
    refresh: authQuery.refetch,
    data: authQuery.data,
    user: authQuery.data?.user ?? null,
    roles: authQuery.data?.roles ?? [],
    permissions: authQuery.data?.permissions ?? [],
    isAuthenticated,
    isLoading,
    isFetching: authQuery.isFetching,
  };
}
