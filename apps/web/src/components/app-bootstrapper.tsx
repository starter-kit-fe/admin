'use client';

import { getMenuTree } from '@/app/dashboard/api';
import { getUserInfo } from '@/app/login/api';
import type { AuthPayloadLoose } from '@/app/login/type';
import { useAuthStore } from '@/stores';
import { usePathname } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

const AUTH_ME_QUERY_KEY = ['auth', 'me'] as const;
export function AppBootstrapper() {
  const queryClient = useQueryClient();
  const { user, setUser, setPermissions, setRoles } = useAuthStore();
  const lastBootstrappedLocaleRef = useRef<AppLocale | null>(null);
  const pathname = usePathname();
  const locale = useLocale() as AppLocale;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const currentPath = pathname ?? window.location.pathname;
    const inDashboard = currentPath.startsWith('/dashboard');

    if (!inDashboard) {
      lastBootstrappedLocaleRef.current = null;
      return;
    }

    if (lastBootstrappedLocaleRef.current === locale) {
      return;
    }

    lastBootstrappedLocaleRef.current = locale;
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
          queryKey: ['auth', 'menus', locale],
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
        queryClient.removeQueries({ queryKey: ['auth', 'menus', locale] });
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [locale, pathname, queryClient, setPermissions, setRoles, setUser]);

  return null;
}
