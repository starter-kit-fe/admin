export const STATUS_TABS = [
  { value: 'all', labelKey: 'status.all', activeColor: 'bg-slate-900 text-white' },
  { value: '0', labelKey: 'status.0', activeColor: 'bg-emerald-500 text-white' },
  { value: '1', labelKey: 'status.1', activeColor: 'bg-rose-500 text-white' },
] as const;

export const DEFAULT_PAGINATION = {
  pageNum: 1,
  pageSize: 10,
} as const;

export const PAGE_SIZE_OPTIONS = [10, 20, 30, 50] as const;

export const BASE_QUERY_KEY = ['system', 'posts', 'list'] as const;
