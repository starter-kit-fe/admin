import { get, post } from '@/lib/request';

import type { OnlineUser, OnlineUserListResponse } from './type';

export interface OnlineUserListParams {
  userName?: string;
  ipaddr?: string;
  since?: string;
  pageNum?: number;
  pageSize?: number;
}

type OnlineUserListResult = OnlineUserListResponse | OnlineUser[];

function buildQuery(params: OnlineUserListParams = {}) {
  const query: Record<string, string> = {};
  if (params.pageNum) {
    query.pageNum = String(params.pageNum);
  }
  if (params.pageSize) {
    query.pageSize = String(params.pageSize);
  }
  if (params.userName && params.userName.trim()) {
    query.userName = params.userName.trim();
  }
  if (params.ipaddr && params.ipaddr.trim()) {
    query.ipaddr = params.ipaddr.trim();
  }
  if (params.since && params.since.trim()) {
    query.since = params.since.trim();
  }
  return query;
}

export function listOnlineUsers(params: OnlineUserListParams = {}) {
  return get<OnlineUserListResult>('/v1/monitor/online/users', buildQuery(params));
}

export function forceLogoutOnlineUser(id: string) {
  const encoded = encodeURIComponent(id);
  return post(`/v1/monitor/online/users/${encoded}/force-logout`);
}

export function batchForceLogoutOnlineUsers(ids: string[]) {
  return post('/v1/monitor/online/users/batch-logout', {
    ids,
  });
}

export function getOnlineUserDetail(id: string) {
  const identifier = encodeURIComponent(id.trim());
  return get<OnlineUser>(`/v1/monitor/online/users/${identifier}`);
}
