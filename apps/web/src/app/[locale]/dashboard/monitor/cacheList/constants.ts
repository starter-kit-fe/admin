export const CACHE_LIST_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export const DEFAULT_CACHE_LIST_FILTERS = {
  pattern: '',
} as const;

export const DEFAULT_CACHE_LIST_PAGINATION = {
  pageNum: 1,
  pageSize: CACHE_LIST_PAGE_SIZE_OPTIONS[0],
} as const;

export const CACHE_LIST_QUERY_KEY = ['monitor', 'cache', 'list'] as const;

export const DEFAULT_DEBOUNCE_MS = 300;
