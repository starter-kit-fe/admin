'use client';

import { useQuery } from '@tanstack/react-query';

import http from '@/lib/request';
import { MenuNode } from '@/types/menu';

interface MenuResponse {
  code: number;
  msg: string | null;
  data: MenuNode[];
}

export function useMenuTree() {
  return useQuery({
    queryKey: ['auth', 'menus'],
    queryFn: async () => {
      const response = await http.get<MenuResponse>('/v1/auth/menus');
      if (response.code && response.code !== 200) {
        throw new Error(response.msg ?? '获取菜单失败');
      }
      return response.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

