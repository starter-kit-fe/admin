export interface DepartmentNode {
  deptId: number;
  parentId: number;
  deptName: string;
  leader?: string | null;
  phone?: string | null;
  email?: string | null;
  orderNum: number;
  status: string;
  remark?: string | null;
  children?: DepartmentNode[];
}
