import { get } from '@/lib/request';

import type { CacheKeyListResponse, CacheOverview } from './type';

export interface CacheKeyListParams {
  pattern?: string;
  pageNum?: number;
  pageSize?: number;
  db?: number;
}

function buildQuery(params: CacheKeyListParams = {}) {
  const query: Record<string, string> = {};
  if (params.pageNum && params.pageNum > 0) {
    query.pageNum = String(params.pageNum);
  }
  if (params.pageSize && params.pageSize > 0) {
    query.pageSize = String(params.pageSize);
  }
  if (typeof params.db === 'number' && !Number.isNaN(params.db)) {
    query.db = String(params.db);
  }
  if (params.pattern) {
    const trimmed = params.pattern.trim();
    if (trimmed.length > 0) {
      query.pattern = trimmed;
    }
  }
  return query;
}

export function getCacheOverview() {
  return get<CacheOverview>('/v1/monitor/cache');
}

export function listCacheKeys(params: CacheKeyListParams = {}) {
  return get<CacheKeyListResponse>('/v1/monitor/cache/list', buildQuery(params));
}
