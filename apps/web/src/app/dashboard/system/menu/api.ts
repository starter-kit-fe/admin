import { get } from '@/lib/request';

import type { MenuTreeNode } from './type';

function buildQuery(params?: { status?: string; menuName?: string }) {
  if (!params) {
    return undefined;
  }
  const query: Record<string, string> = {};
  if (params.status && params.status.trim()) {
    query.status = params.status.trim();
  }
  if (params.menuName && params.menuName.trim()) {
    query.menuName = params.menuName.trim();
  }
  return Object.keys(query).length > 0 ? query : undefined;
}

export function listMenuTree(params?: { status?: string; menuName?: string }) {
  return get<MenuTreeNode[]>('/v1/system/menus/tree', buildQuery(params));
}
