export interface OperLog {
  operId: number;
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
  operTime?: string | null;
  costTime: number;
}

export interface OperLogListResponse {
  items: OperLog[];
  total: number;
  pageNum: number;
  pageSize: number;
}
