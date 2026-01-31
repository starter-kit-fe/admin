export interface Role {
  id: number;
  roleName: string;
  roleKey: string;
  roleSort: number;
  dataScope: string;
  menuCheckStrictly: boolean;
  deptCheckStrictly: boolean;
  status: '0' | '1';
  remark?: string | null;
  createBy: string;
  createdAt?: string | null;
  updateBy: string;
  updatedAt?: string | null;
  menuIds?: number[];
}

export interface RoleListResponse {
  list: Role[];
  total: number;
  pageNum: number;
  pageSize: number;
}

export interface RoleListParams {
  pageNum?: number;
  pageSize?: number;
  roleName?: string;
  status?: string;
}

export interface CreateRolePayload {
  roleName: string;
  roleKey: string;
  roleSort?: number;
  dataScope?: string;
  menuCheckStrictly?: boolean;
  deptCheckStrictly?: boolean;
  status?: '0' | '1';
  remark?: string | null;
  menuIds?: number[];
}

export interface UpdateRolePayload {
  roleName?: string;
  roleKey?: string;
  roleSort?: number;
  dataScope?: string;
  menuCheckStrictly?: boolean;
  deptCheckStrictly?: boolean;
  status?: '0' | '1';
  remark?: string | null;
  menuIds?: number[];
}

export interface RoleFormValues {
  roleName: string;
  roleKey: string;
  roleSort: string;
  dataScope: '1' | '2' | '3' | '4' | '5';
  menuCheckStrictly: boolean;
  deptCheckStrictly: boolean;
  status: '0' | '1';
  remark: string;
  menuIds: number[];
}
