import { del, get, post, put } from '@/lib/request';

import type {
  CreateUserPayload,
  DeptOption,
  PostOption,
  ResetPasswordPayload,
  RoleOption,
  UpdateUserPayload,
  User,
  UserListParams,
  UserListResponse,
} from './type';

function buildQuery(params: UserListParams = {}) {
  const query: Record<string, string | number> = {};
  if (typeof params.pageNum === 'number' && params.pageNum > 0) {
    query.pageNum = params.pageNum;
  }
  if (typeof params.pageSize === 'number' && params.pageSize >= 0) {
    query.pageSize = params.pageSize;
  }
  if (params.userName && params.userName.trim()) {
    query.userName = params.userName.trim();
  }
  if (params.status && params.status !== 'all') {
    query.status = params.status;
  }
  return query;
}

export function listUsers(params: UserListParams = {}) {
  return get<UserListResponse>('/v1/system/users', buildQuery(params));
}

export function getUserDetail(id: number) {
  return get<User>(`/v1/system/users/${id}`);
}

export function createUser(payload: CreateUserPayload) {
  return post<User>('/v1/system/users', payload);
}

export function updateUser(id: number, payload: UpdateUserPayload) {
  return put<User>(`/v1/system/users/${id}`, payload);
}

export function removeUser(id: number) {
  return del<void>(`/v1/system/users/${id}`);
}

export function listDeptOptions(keyword?: string) {
  return get<DeptOption[]>(
    '/v1/system/users/options/departments',
    keyword ? { keyword, limit: 15 } : { limit: 15 },
  );
}

export function listRoleOptions(keyword?: string) {
  return get<RoleOption[]>(
    '/v1/system/users/options/roles',
    keyword ? { keyword, limit: 15 } : { limit: 15 },
  );
}

export function listPostOptions(keyword?: string) {
  return get<PostOption[]>(
    '/v1/system/users/options/posts',
    keyword ? { keyword, limit: 15 } : { limit: 15 },
  );
}

export function resetUserPassword(id: number, payload: ResetPasswordPayload) {
  return post<void>(`/v1/system/users/${id}/reset-password`, payload);
}
