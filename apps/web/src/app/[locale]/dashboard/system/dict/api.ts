import { del, get, post, put } from '@/lib/request';

import type { DictData, DictDataList, DictType } from './type';

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

export interface DictDataListParams {
  status?: string;
  dictLabel?: string;
  dictValue?: string;
}

function buildDataQuery(params: DictDataListParams = {}) {
  const query: Record<string, string> = {};
  if (params.status && params.status.trim()) {
    query.status = params.status.trim();
  }
  if (params.dictLabel && params.dictLabel.trim()) {
    query.dictLabel = params.dictLabel.trim();
  }
  if (params.dictValue && params.dictValue.trim()) {
    query.dictValue = params.dictValue.trim();
  }
  return Object.keys(query).length > 0 ? query : undefined;
}

export interface CreateDictTypePayload {
  dictName: string;
  dictType: string;
  status?: string;
  remark?: string;
}

export interface UpdateDictTypePayload extends Partial<CreateDictTypePayload> {}

export interface CreateDictDataPayload {
  dictLabel: string;
  dictValue: string;
  dictSort?: number;
  status?: string;
  isDefault?: string;
  remark?: string;
}

export interface UpdateDictDataPayload extends Partial<CreateDictDataPayload> {}

export function getDictType(id: number) {
  return get<DictType>(`/v1/system/dicts/${id}`);
}

export function createDictType(payload: CreateDictTypePayload) {
  return post<DictType>('/v1/system/dicts', payload);
}

export function updateDictType(id: number, payload: UpdateDictTypePayload) {
  return put<DictType>(`/v1/system/dicts/${id}`, payload);
}

export function removeDictType(id: number) {
  return del(`/v1/system/dicts/${id}`);
}

export function listDictData(id: number, params: DictDataListParams = {}) {
  return get<DictDataList>(
    `/v1/system/dicts/${id}/data`,
    buildDataQuery(params),
  );
}

export function createDictData(id: number, payload: CreateDictDataPayload) {
  return post<DictData>(`/v1/system/dicts/${id}/data`, payload);
}

export function updateDictData(
  dictId: number,
  id: number,
  payload: UpdateDictDataPayload,
) {
  return put<DictData>(`/v1/system/dicts/${dictId}/data/${id}`, payload);
}

export function removeDictData(dictId: number, id: number) {
  return del(`/v1/system/dicts/${dictId}/data/${id}`);
}
