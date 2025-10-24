import { get } from '@/lib/request';

import type { DictType } from './type';

export interface DictListParams {
  status?: string;
  dictName?: string;
  dictType?: string;
}

export function listDictTypes(params: DictListParams = {}) {
  return get<DictType[]>('/v1/system/dicts', params);
}
