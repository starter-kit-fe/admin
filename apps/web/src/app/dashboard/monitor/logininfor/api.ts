import { del, get, post } from '@/lib/request';

import type { LoginLogListResponse } from './type';

export interface LoginLogListParams {
  pageNum?: number;
  pageSize?: number;
  userName?: string;
  status?: string;
  ipaddr?: string;
}

function buildQuery(params: LoginLogListParams = {}) {
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
  if (params.status && params.status.trim()) {
    query.status = params.status.trim();
  }
  if (params.ipaddr && params.ipaddr.trim()) {
    query.ipaddr = params.ipaddr.trim();
  }
  return query;
}

export function listLoginLogs(params: LoginLogListParams = {}) {
  return get<LoginLogListResponse>('/v1/monitor/logs/login', buildQuery(params));
}

export function removeLoginLog(id: number) {
  return del(`/v1/monitor/logs/login/${id}`);
}

export function unlockLogin(id: number) {
  return post(`/v1/monitor/logs/login/${id}/unlock`);
}
