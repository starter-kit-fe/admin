import { del, get, post, put } from '@/lib/request';

import type {
  CreateRolePayload,
  Role,
  RoleListParams,
  RoleListResponse,
  UpdateRolePayload,
} from './type';

function buildQuery(params: RoleListParams = {}) {
  const query: Record<string, string | number> = {};
  if (typeof params.pageNum === 'number' && params.pageNum > 0) {
    query.pageNum = params.pageNum;
  }
  if (typeof params.pageSize === 'number' && params.pageSize >= 0) {
    query.pageSize = params.pageSize;
  }
  if (params.roleName && params.roleName.trim()) {
    query.roleName = params.roleName.trim();
  }
  if (params.status && params.status !== 'all') {
    query.status = params.status;
  }
  return query;
}

export function listRoles(params: RoleListParams = {}) {
  return get<RoleListResponse>('/v1/system/roles', buildQuery(params));
}

export function getRoleDetail(id: number) {
  return get<Role>(`/v1/system/roles/${id}`);
}

export function createRole(payload: CreateRolePayload) {
  return post<Role>('/v1/system/roles', payload);
}

export function updateRole(id: number, payload: UpdateRolePayload) {
  return put<Role>(`/v1/system/roles/${id}`, payload);
}

export function removeRole(id: number) {
  return del<void>(`/v1/system/roles/${id}`);
}
