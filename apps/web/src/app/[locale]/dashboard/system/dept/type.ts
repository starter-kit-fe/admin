import { z } from 'zod';

export type DepartmentStatus = '0' | '1';

export interface DepartmentNode {
  deptId: number;
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

export const buildDepartmentFormSchema = (
  t: (path: string) => string,
) =>
  z.object({
    deptName: z
      .string()
      .trim()
      .min(1, t('validation.name.required'))
      .max(50, t('validation.name.max')),
    parentId: z.string().trim().min(1, t('validation.parent.required')),
    orderNum: z
      .string()
      .trim()
      .refine((value) => {
        if (value === '') return true;
        if (!/^\d+$/.test(value)) return false;
        const parsed = Number(value);
        return parsed >= 0 && parsed <= 9999;
      }, t('validation.order.invalid')),
    leader: z.string().trim().max(50, t('validation.leader.max')),
    phone: z
      .string()
      .trim()
      .refine(
        (value) =>
          value === '' ||
          /^1\d{10}$/.test(value) ||
          /^0\d{2,3}-?\d{7,8}$/.test(value) ||
          /^\+?[0-9\-]{6,18}$/.test(value),
        t('validation.phone.invalid'),
      ),
    email: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        t('validation.email.invalid'),
      ),
    status: z.enum(['0', '1']),
    remark: z.string().trim().max(255, t('validation.remark.max')),
  });

export interface DepartmentFormValues {
  deptName: string;
  parentId: string;
  orderNum: string;
  leader: string;
  phone: string;
  email: string;
  status: DepartmentStatus;
  remark: string;
}

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
