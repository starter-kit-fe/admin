import type { RoleFormValues, Role } from './type';

export function toFormValues(role: Role): RoleFormValues {
  return {
    roleName: role.roleName ?? '',
    roleKey: role.roleKey ?? '',
    roleSort: role.roleSort != null ? String(role.roleSort) : '',
    dataScope: (['1', '2', '3', '4', '5'].includes(role.dataScope)
      ? role.dataScope
      : '1') as RoleFormValues['dataScope'],
    menuCheckStrictly: role.menuCheckStrictly,
    deptCheckStrictly: role.deptCheckStrictly,
    status: role.status ?? '0',
    remark: role.remark ?? '',
    menuIds: role.menuIds ?? [],
  };
}

export function toCreatePayload(values: RoleFormValues) {
  return {
    roleName: values.roleName.trim(),
    roleKey: values.roleKey.trim(),
    roleSort: values.roleSort === '' ? undefined : Number(values.roleSort),
    dataScope: values.dataScope,
    menuCheckStrictly: values.menuCheckStrictly,
    deptCheckStrictly: values.deptCheckStrictly,
    status: values.status,
    remark: values.remark.trim() === '' ? undefined : values.remark.trim(),
    menuIds: values.menuIds,
  };
}

export function toUpdatePayload(values: RoleFormValues) {
  return {
    roleName: values.roleName.trim(),
    roleKey: values.roleKey.trim(),
    roleSort: values.roleSort === '' ? undefined : Number(values.roleSort),
    dataScope: values.dataScope,
    menuCheckStrictly: values.menuCheckStrictly,
    deptCheckStrictly: values.deptCheckStrictly,
    status: values.status,
    remark: values.remark.trim() === '' ? undefined : values.remark.trim(),
    menuIds: values.menuIds,
  };
}
