export const NOTICE_STATUS_TABS = [
  { value: 'all', label: '全部', color: 'bg-slate-900 text-white' },
  { value: '0', label: '正常', color: 'bg-emerald-500 text-white' },
  { value: '1', label: '停用', color: 'bg-rose-500 text-white' },
] as const;

export const NOTICE_TYPE_OPTIONS = [
  { value: 'all', label: '全部类型' },
  { value: '1', label: '通知' },
  { value: '2', label: '公告' },
] as const;

export const BASE_NOTICE_QUERY_KEY = ['system', 'notices', 'list'] as const;

export const DEFAULT_DEBOUNCE_MS = 300;
