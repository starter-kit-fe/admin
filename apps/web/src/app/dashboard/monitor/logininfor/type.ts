export interface LoginLog {
  infoId: number;
  userName: string;
  ipaddr: string;
  loginLocation: string;
  browser: string;
  os: string;
  status: string;
  msg: string;
  loginTime?: string | null;
}

export interface LoginLogListResponse {
  items: LoginLog[];
  total: number;
  pageNum: number;
  pageSize: number;
}
