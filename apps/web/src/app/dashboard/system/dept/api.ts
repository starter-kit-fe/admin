import { get } from '@/lib/request';

import type { DepartmentNode } from './type';

function buildQuery(params?: { status?: string; deptName?: string }) {
  if (!params) {
    return undefined;
  }
  const query: Record<string, string> = {};
  if (params.status && params.status.trim()) {
    query.status = params.status.trim();
  }
  if (params.deptName && params.deptName.trim()) {
    query.deptName = params.deptName.trim();
  }
  return Object.keys(query).length > 0 ? query : undefined;
}

export function listDepartmentTree(params?: { status?: string; deptName?: string }) {
  return get<DepartmentNode[]>('/v1/system/departments/tree', buildQuery(params));
}
