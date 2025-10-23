import { del, get, post, put } from '@/lib/request';

import type {
  CreateUserPayload,
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

export function getUserDetail(userId: number) {
  return get<User>(`/v1/system/users/${userId}`);
}

export function createUser(payload: CreateUserPayload) {
  return post<User>('/v1/system/users', payload);
}

export function updateUser(userId: number, payload: UpdateUserPayload) {
  return put<User>(`/v1/system/users/${userId}`, payload);
}

export function removeUser(userId: number) {
  return del<void>(`/v1/system/users/${userId}`);
}
