export const STATUS_TABS = [
  { value: 'all', label: '全部' },
  { value: '0', label: '启用' },
  { value: '1', label: '停用' },
] as const;

export const DEFAULT_PAGINATION = {
  pageNum: 1,
  pageSize: 10,
} as const;

export const PAGE_SIZE_OPTIONS = [10, 20, 30, 50] as const;

export const BASE_QUERY_KEY = ['system', 'roles', 'list'] as const;
