import { del, get } from '@/lib/request';

import type { OperLogListResponse } from './type';

export interface OperLogListParams {
  pageNum?: number;
  pageSize?: number;
  title?: string;
  businessType?: string;
  status?: string;
  operName?: string;
  requestMethod?: string;
}

function buildQuery(params: OperLogListParams = {}) {
  const query: Record<string, string> = {};
  if (params.pageNum) {
    query.pageNum = String(params.pageNum);
  }
  if (params.pageSize) {
    query.pageSize = String(params.pageSize);
  }
  if (params.title && params.title.trim()) {
    query.title = params.title.trim();
  }
  if (params.businessType && params.businessType.trim()) {
    query.businessType = params.businessType.trim();
  }
  if (params.status && params.status.trim()) {
    query.status = params.status.trim();
  }
  if (params.operName && params.operName.trim()) {
    query.operName = params.operName.trim();
  }
  if (params.requestMethod && params.requestMethod.trim()) {
    query.requestMethod = params.requestMethod.trim();
  }
  return query;
}

export function listOperLogs(params: OperLogListParams = {}) {
  return get<OperLogListResponse>('/v1/monitor/logs/operations', buildQuery(params));
}

export function removeOperLog(id: number) {
  return del(`/v1/monitor/logs/operations/${id}`);
}
