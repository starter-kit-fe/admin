export const STATUS_TABS = [
  { value: 'all', labelKey: 'statusTabs.all', color: 'bg-slate-900 text-white' },
  { value: '0', labelKey: 'statusTabs.0', color: 'bg-primary text-white' },
  { value: '1', labelKey: 'statusTabs.1', color: 'bg-rose-500 text-white' },
] as const;

export const DEFAULT_PAGINATION = {
  pageNum: 1,
  pageSize: 10,
} as const;

export const PAGE_SIZE_OPTIONS = [10, 20, 30, 50] as const;
