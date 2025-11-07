export const LOGIN_LOG_STATUS_TABS = [
  { value: 'all', label: '全部状态' },
  { value: '0', label: '成功' },
  { value: '1', label: '失败' },
] as const;

export const LOGIN_LOG_PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export const DEFAULT_LOGIN_LOG_PAGINATION = {
  pageNum: 1,
  pageSize: LOGIN_LOG_PAGE_SIZE_OPTIONS[0],
};

export const BASE_LOGIN_LOG_QUERY_KEY = [
  'monitor',
  'loginlog',
  'list',
] as const;

export const DEFAULT_DEBOUNCE_MS = 300;
