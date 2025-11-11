import type { RoleFormValues, Role } from './type';

const DATA_SCOPE_VALUES = new Set(['1', '2', '3', '4', '5']);
const DEFAULT_DATA_SCOPE: RoleFormValues['dataScope'] = '1';

function ensureDataScope(scope?: string): RoleFormValues['dataScope'] {
  if (scope && DATA_SCOPE_VALUES.has(scope)) {
    return scope as RoleFormValues['dataScope'];
  }
  return DEFAULT_DATA_SCOPE;
}

function sanitizeMenuIds(ids?: Array<number | string | null>) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return [] as number[];
  }
  const seen = new Set<number>();
  const result: number[] = [];
  ids.forEach((value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }
    const normalized = Math.trunc(parsed);
    if (normalized <= 0 || seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    result.push(normalized);
  });
  return result.sort((a, b) => a - b);
}

export function toFormValues(role: Role): RoleFormValues {
  return {
    roleName: role.roleName ?? '',
    roleKey: role.roleKey ?? '',
    roleSort: role.roleSort != null ? String(role.roleSort) : '',
    dataScope: ensureDataScope(role.dataScope),
    menuCheckStrictly: role.menuCheckStrictly,
    deptCheckStrictly: role.deptCheckStrictly,
    status: role.status ?? '0',
    remark: role.remark ?? '',
    menuIds: sanitizeMenuIds(role.menuIds),
  };
}

export function toCreatePayload(values: RoleFormValues) {
  return {
    roleName: values.roleName.trim(),
    roleKey: values.roleKey.trim(),
    roleSort: values.roleSort === '' ? undefined : Number(values.roleSort),
    dataScope: ensureDataScope(values.dataScope),
    menuCheckStrictly: values.menuCheckStrictly,
    deptCheckStrictly: values.deptCheckStrictly,
    status: values.status,
    remark: values.remark.trim() === '' ? undefined : values.remark.trim(),
    menuIds: sanitizeMenuIds(values.menuIds),
  };
}

export function toUpdatePayload(values: RoleFormValues) {
  return {
    roleName: values.roleName.trim(),
    roleKey: values.roleKey.trim(),
    roleSort: values.roleSort === '' ? undefined : Number(values.roleSort),
    dataScope: ensureDataScope(values.dataScope),
    menuCheckStrictly: values.menuCheckStrictly,
    deptCheckStrictly: values.deptCheckStrictly,
    status: values.status,
    remark: values.remark.trim() === '' ? undefined : values.remark.trim(),
    menuIds: sanitizeMenuIds(values.menuIds),
  };
}
