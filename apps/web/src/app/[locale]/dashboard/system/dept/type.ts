import { z } from 'zod';

export type DepartmentStatus = '0' | '1';

export interface DepartmentNode {
  id: number;
  parentId: number;
  deptName: string;
  leader?: string | null;
  phone: string | null;
  email?: string | null;
  orderNum: number;
  status: DepartmentStatus;
  remark?: string | null;
  children?: DepartmentNode[];
}

export const departmentFormSchema = z.object({
  deptName: z
    .string()
    .trim()
    .min(1, '请输入部门名称')
    .max(50, '部门名称不能超过 50 个字符'),
  parentId: z.string().trim().min(1, '请选择上级部门'),
  orderNum: z
    .string()
    .trim()
    .refine((value) => {
      if (value === '') return true;
      if (!/^\d+$/.test(value)) return false;
      const parsed = Number(value);
      return parsed >= 0 && parsed <= 9999;
    }, '显示排序需为 0 到 9999 的整数'),
  leader: z.string().trim().max(50, '负责人不能超过 50 个字符'),
  phone: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === '' ||
        /^1\d{10}$/.test(value) ||
        /^0\d{2,3}-?\d{7,8}$/.test(value) ||
        /^\+?[0-9\-]{6,18}$/.test(value),
      '请输入有效联系电话',
    ),
  email: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      '请输入正确邮箱',
    ),
  status: z.enum(['0', '1']),
  remark: z.string().trim().max(255, '备注不能超过 255 个字符'),
});

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

export interface CreateDepartmentPayload {
  deptName: string;
  parentId: number;
  orderNum: number;
  leader?: string | null;
  phone?: string | null;
  email?: string | null;
  status: DepartmentStatus;
  remark?: string | null;
}

export type UpdateDepartmentPayload = Partial<CreateDepartmentPayload>;

export interface DepartmentParentOption {
  value: string;
  label: string;
  level: number;
  path: string[];
  parentId?: string;
  disabled?: boolean;
}
