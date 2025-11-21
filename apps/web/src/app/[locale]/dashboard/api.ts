import { get } from '@/lib/request';
import { MenuNode } from '@/types';

export function getMenuTree() {
  return get<MenuNode[]>('/v1/auth/menus');
}
