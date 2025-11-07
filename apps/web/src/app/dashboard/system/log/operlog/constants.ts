export const OPER_LOG_STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: '0', label: '成功' },
  { value: '1', label: '失败' },
] as const;

export const OPER_LOG_BUSINESS_TYPE_OPTIONS = [
  { value: 'all', label: '全部业务' },
  { value: '0', label: '其它' },
  { value: '1', label: '新增' },
  { value: '2', label: '修改' },
  { value: '3', label: '删除' },
  { value: '4', label: '授权' },
  { value: '5', label: '导出' },
  { value: '6', label: '导入' },
] as const;

export const OPER_LOG_REQUEST_METHOD_OPTIONS = [
  { value: 'all', label: '全部请求' },
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
] as const;

export const OPER_LOG_PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export const DEFAULT_OPER_LOG_PAGINATION = {
  pageNum: 1,
  pageSize: OPER_LOG_PAGE_SIZE_OPTIONS[0],
};

export const BASE_OPER_LOG_QUERY_KEY = [
  'monitor',
  'operlog',
  'list',
] as const;

export const DEFAULT_DEBOUNCE_MS = 300;

export const OPER_LOG_BUSINESS_TYPE_LABELS: Record<string, string> = {
  '0': '其它',
  '1': '新增',
  '2': '修改',
  '3': '删除',
  '4': '授权',
  '5': '导出',
  '6': '导入',
};
