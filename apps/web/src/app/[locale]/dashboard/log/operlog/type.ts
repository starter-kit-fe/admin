export interface OperLog {
  id: number;
  title: string;
  businessType: number;
  method: string;
  requestMethod: string;
  operatorType: number;
  operName: string;
  deptName: string;
  operUrl: string;
  operIp: string;
  operLocation: string;
  operParam: string;
  jsonResult: string;
  status: number;
  errorMsg: string;
  createdAt?: string | null;
  costTime: number;
}

export interface OperLogListResponse {
  list: OperLog[];
  total: number;
  pageNum: number;
  pageSize: number;
}
