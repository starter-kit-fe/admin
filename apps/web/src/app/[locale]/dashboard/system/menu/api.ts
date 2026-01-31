import { del, get, post, put } from '@/lib/request';

import type {
  CreateMenuPayload,
  MenuOrderUpdate,
  MenuTreeNode,
  UpdateMenuPayload,
} from './type';

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

export function createMenu(payload: CreateMenuPayload) {
  return post<MenuTreeNode>('/v1/system/menus', payload);
}

export function updateMenu(id: number, payload: UpdateMenuPayload) {
  return put<MenuTreeNode>(`/v1/system/menus/${id}`, payload);
}

export function removeMenu(id: number) {
  return del<void>(`/v1/system/menus/${id}`);
}

export function reorderMenus(payload: MenuOrderUpdate[]) {
  return put<void>('/v1/system/menus/reorder', {
    items: payload,
  });
}
