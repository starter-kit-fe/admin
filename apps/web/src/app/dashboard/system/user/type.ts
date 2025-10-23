export interface UserListParams {
  pageNum?: number;
  pageSize?: number;
  userName?: string;
  status?: string;
}

export interface User {
  userId: number;
  deptId?: number | null;
  deptName?: string | null;
  userName: string;
  nickName: string;
  userType: string;
  email: string;
  phonenumber: string;
  sex: string;
  avatar: string;
  status: string;
  remark?: string | null;
  loginIp: string;
  loginDate?: string | null;
  pwdUpdateDate?: string | null;
  createBy: string;
  createTime?: string | null;
  updateBy: string;
  updateTime?: string | null;
}

export interface UserListResponse {
  items: User[];
  total: number;
  pageNum: number;
  pageSize: number;
}

export interface CreateUserPayload {
  userName: string;
  nickName: string;
  deptId?: number;
  email?: string;
  phonenumber?: string;
  sex?: string;
  status?: string;
  password: string;
  remark?: string | null;
}

export interface UpdateUserPayload {
  userName?: string;
  nickName?: string;
  deptId?: number;
  email?: string;
  phonenumber?: string;
  sex?: string;
  status?: string;
  remark?: string | null;
}

export interface UserFormValues {
  userName: string;
  nickName: string;
  email: string;
  phonenumber: string;
  sex: '0' | '1' | '2';
  status: '0' | '1';
  deptId: string;
  remark: string;
  password?: string;
}
