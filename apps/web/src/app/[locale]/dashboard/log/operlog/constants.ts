export const OPER_LOG_STATUS_OPTIONS = ['all', '0', '1'] as const;

export const OPER_LOG_STATUS_TABS = [
  { value: 'all', color: 'bg-slate-900 text-white' },
  { value: '0', color: 'bg-emerald-500 text-white' },
  { value: '1', color: 'bg-rose-500 text-white' },
] as const;

export const OPER_LOG_BUSINESS_TYPE_OPTIONS = [
  { value: 'all' },
  { value: '0' },
  { value: '1' },
  { value: '2' },
  { value: '3' },
  { value: '4' },
  { value: '5' },
  { value: '6' },
] as const;

export const OPER_LOG_REQUEST_METHOD_OPTIONS = [
  { value: 'all' },
  { value: 'GET' },
  { value: 'POST' },
  { value: 'PUT' },
  { value: 'DELETE' },
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
