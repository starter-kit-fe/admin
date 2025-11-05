export type DepartmentStatus = '0' | '1';

export interface DepartmentNode {
  deptId: number;
  parentId: number;
  deptName: string;
  leader?: string | null;
  phone?: string | null;
  email?: string | null;
  orderNum: number;
  status: DepartmentStatus;
  remark?: string | null;
  children?: DepartmentNode[];
}

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
