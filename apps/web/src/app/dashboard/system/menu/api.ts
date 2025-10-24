import { get } from '@/lib/request';

import type { MenuTreeNode } from './type';

export function listMenuTree(params?: { status?: string; menuName?: string }) {
  return get<MenuTreeNode[]>('/v1/system/menus/tree', params);
}
