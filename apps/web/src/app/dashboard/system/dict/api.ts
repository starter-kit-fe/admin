import { get } from '@/lib/request';

import type { DictType } from './type';

export interface DictListParams {
  status?: string;
  dictName?: string;
  dictType?: string;
}

function buildQuery(params: DictListParams = {}) {
  const query: Record<string, string> = {};
  if (params.status && params.status.trim()) {
    query.status = params.status.trim();
  }
  if (params.dictName && params.dictName.trim()) {
    query.dictName = params.dictName.trim();
  }
  if (params.dictType && params.dictType.trim()) {
    query.dictType = params.dictType.trim();
  }
  return Object.keys(query).length > 0 ? query : undefined;
}

export function listDictTypes(params: DictListParams = {}) {
  return get<DictType[]>('/v1/system/dicts', buildQuery(params));
}
