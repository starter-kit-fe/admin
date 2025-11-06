export const STATUS_TABS = [
  { value: 'all', label: '全部', color: 'bg-slate-900 text-white' },
  { value: '0', label: '启用', color: 'bg-emerald-500 text-white' },
  { value: '1', label: '停用', color: 'bg-rose-500 text-white' },
] as const;

export const DEFAULT_PAGINATION = {
  pageNum: 1,
  pageSize: 10,
} as const;

export const PAGE_SIZE_OPTIONS = [10, 20, 30, 50] as const;
