export const NOTICE_STATUS_TABS = [
  { value: 'all', label: '全部' },
  { value: '0', label: '正常' },
  { value: '1', label: '停用' },
] as const;

export const NOTICE_TYPE_TABS = [
  { value: 'all', label: '全部类型' },
  { value: '1', label: '通知' },
  { value: '2', label: '公告' },
] as const;

export const BASE_NOTICE_QUERY_KEY = ['system', 'notices', 'list'] as const;

export const DEFAULT_DEBOUNCE_MS = 300;
