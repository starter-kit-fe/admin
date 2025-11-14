import { del, get, post, put } from '@/lib/request';

import type { SystemConfig } from './type';

export interface ConfigListParams {
  configName?: string;
  configKey?: string;
  configType?: string;
}

function buildQuery(params: ConfigListParams = {}) {
  const query: Record<string, string> = {};
  if (params.configName && params.configName.trim()) {
    query.configName = params.configName.trim();
  }
  if (params.configKey && params.configKey.trim()) {
    query.configKey = params.configKey.trim();
  }
  if (params.configType && params.configType.trim()) {
    query.configType = params.configType.trim();
  }
  return Object.keys(query).length > 0 ? query : undefined;
}

export function listConfigs(params: ConfigListParams = {}) {
  return get<SystemConfig[]>('/v1/system/configs', buildQuery(params));
}

export interface CreateConfigPayload {
  configName: string;
  configKey: string;
  configValue: string;
  configType?: string;
  remark?: string;
}

export interface UpdateConfigPayload extends Partial<CreateConfigPayload> {}

export function createConfig(payload: CreateConfigPayload) {
  return post<SystemConfig>('/v1/system/configs', payload);
}

export function updateConfig(id: number, payload: UpdateConfigPayload) {
  return put<SystemConfig>(`/v1/system/configs/${id}`, payload);
}

export function removeConfig(id: number) {
  return del(`/v1/system/configs/${id}`);
}
