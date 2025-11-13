'use client';

import { getMenuTree } from '@/app/dashboard/api';
import { getUserInfo } from '@/app/login/api';
import type { AuthPayloadLoose } from '@/app/login/type';
import { useAuthStore } from '@/stores';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const AUTH_ME_QUERY_KEY = ['auth', 'me'] as const;
const AUTH_MENU_QUERY_KEY = ['auth', 'menus'] as const;

export function AppBootstrapper() {
  const queryClient = useQueryClient();
  const { user, setUser, setPermissions, setRoles } = useAuthStore();
  const hasBootstrappedRef = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const currentPath = pathname ?? window.location.pathname;
    const inDashboard = currentPath.startsWith('/dashboard');

    if (!inDashboard) {
      hasBootstrappedRef.current = false;
      return;
    }

    if (hasBootstrappedRef.current) {
      return;
    }

    hasBootstrappedRef.current = true;
    let cancelled = false;

    const bootstrap = async () => {
      const [meResult, menuResult] = await Promise.allSettled([
        queryClient.fetchQuery<AuthPayloadLoose>({
          queryKey: AUTH_ME_QUERY_KEY,
          queryFn: getUserInfo,
          staleTime: 0,
          retry: false,
        }),
        queryClient.fetchQuery({
          queryKey: AUTH_MENU_QUERY_KEY,
          queryFn: getMenuTree,
          staleTime: 60_000,
          retry: false,
        }),
      ]);

      if (cancelled) {
        return;
      }

      if (meResult.status === 'fulfilled') {
        const payload = meResult.value;
        setUser(payload.user);
        setPermissions(payload.permissions ?? []);
        setRoles(payload.roles ?? []);
      } else {
        setUser(null);
        setPermissions(null);
        setRoles(null);
        queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY });
      }

      if (menuResult.status === 'rejected') {
        queryClient.removeQueries({ queryKey: AUTH_MENU_QUERY_KEY });
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [pathname, queryClient, setPermissions, setRoles, setUser]);

  return null;
}
