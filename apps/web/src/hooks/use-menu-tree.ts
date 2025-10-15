'use client';

import { useQuery } from '@tanstack/react-query';

import http from '@/lib/request';
import { MenuNode } from '@/types/menu';

export function useMenuTree() {
  return useQuery({
    queryKey: ['auth', 'menus'],
    queryFn: async () => {
      const menus = await http.get<MenuNode[] | null>('/v1/auth/menus');
      return menus ?? [];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
