import type {
  CreateDepartmentPayload,
  DepartmentFormValues,
  DepartmentNode,
  DepartmentParentOption,
  UpdateDepartmentPayload,
} from './type';

function normalizeOptional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export function toFormValues(node: DepartmentNode): DepartmentFormValues {
  return {
    deptName: node.deptName ?? '',
    parentId: String(node.parentId ?? 0),
    orderNum:
      node.orderNum != null ? String(node.orderNum) : '',
    leader: node.leader ?? '',
    phone: node.phone ?? '',
    email: node.email ?? '',
    status: node.status,
    remark: node.remark ?? '',
  };
}

export function toCreatePayload(
  values: DepartmentFormValues,
): CreateDepartmentPayload {
  const orderNum =
    values.orderNum.trim() === '' ? 0 : Number(values.orderNum);
  return {
    deptName: values.deptName.trim(),
    parentId: Number(values.parentId) || 0,
    orderNum: Number.isNaN(orderNum) ? 0 : orderNum,
    leader: normalizeOptional(values.leader) ?? null,
    phone: normalizeOptional(values.phone) ?? null,
    email: normalizeOptional(values.email) ?? null,
    status: values.status,
    remark: normalizeOptional(values.remark) ?? null,
  };
}

export const toUpdatePayload = (
  values: DepartmentFormValues,
): UpdateDepartmentPayload => toCreatePayload(values);

export function collectDescendantIds(node?: DepartmentNode): number[] {
  if (!node?.children || node.children.length === 0) {
    return [];
  }
  const result: number[] = [];
  const stack = [...node.children];
  while (stack.length > 0) {
    const current = stack.pop()!;
    result.push(current.deptId);
    if (current.children && current.children.length > 0) {
      stack.push(...current.children);
    }
  }
  return result;
}

export function buildParentOptions(
  nodes: DepartmentNode[],
  excludeIds: Set<number>,
): DepartmentParentOption[] {
  const options: DepartmentParentOption[] = [
    {
      value: '0',
      label: '顶级部门',
      level: 0,
      path: ['顶级部门'],
      disabled: excludeIds.has(0),
    },
  ];

  const walk = (
    items: DepartmentNode[],
    depth: number,
    ancestors: string[],
  ) => {
    items.forEach((item) => {
      const path = [...ancestors, item.deptName];
      options.push({
        value: String(item.deptId),
        label: item.deptName,
        level: depth,
        path,
        parentId: String(item.parentId),
        disabled: excludeIds.has(item.deptId),
      });
      if (item.children && item.children.length > 0) {
        walk(item.children, depth + 1, path);
      }
    });
  };

  walk(nodes, 1, []);
  return options;
}

export function resolveErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  return fallback;
}
