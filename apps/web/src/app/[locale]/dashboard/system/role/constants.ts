export const STATUS_TABS = [
  { value: 'all', labelKey: 'filters.statusTabs.all' },
  { value: '0', labelKey: 'filters.statusTabs.0' },
  { value: '1', labelKey: 'filters.statusTabs.1' },
] as const;

export const DEFAULT_PAGINATION = {
  pageNum: 1,
  pageSize: 10,
} as const;

export const PAGE_SIZE_OPTIONS = [10, 20, 30, 50] as const;

export const BASE_QUERY_KEY = ['system', 'roles', 'list'] as const;
