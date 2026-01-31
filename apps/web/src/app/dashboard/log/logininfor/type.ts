export interface LoginLog {
  id: number;
  userName: string;
  ipaddr: string;
  loginLocation: string;
  browser: string;
  os: string;
  status: string;
  msg: string;
  createdAt?: string | null;
}

export interface LoginLogListResponse {
  list: LoginLog[];
  total: number;
  pageNum: number;
  pageSize: number;
}
