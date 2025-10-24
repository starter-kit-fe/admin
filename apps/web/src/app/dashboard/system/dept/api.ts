import { get } from '@/lib/request';

import type { DepartmentNode } from './type';

export function listDepartmentTree(params?: { status?: string; deptName?: string }) {
  return get<DepartmentNode[]>('/v1/system/departments/tree', params);
}
