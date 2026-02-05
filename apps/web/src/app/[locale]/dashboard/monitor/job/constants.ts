export const BASE_QUERY_KEY = ['monitor', 'jobs'] as const;

export const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export const STATUS_TAB_KEYS = ['all', '0', '1'] as const;

export type JobStatusFilter = (typeof STATUS_TAB_KEYS)[number];

export type JobFilterState = {
  jobName: string;
  jobGroup: string;
  status: JobStatusFilter;
};

export type PaginationState = {
  pageNum: number;
  pageSize: number;
};

export const DEFAULT_FILTERS: JobFilterState = {
  jobName: '',
  jobGroup: '',
  status: 'all',
};

export const DEFAULT_PAGINATION: PaginationState = {
  pageNum: 1,
  pageSize: PAGE_SIZE_OPTIONS[0],
};

export const STATUS_BADGE_VARIANT: Record<
  string,
  'secondary' | 'destructive' | 'outline'
> = {
  '0': 'secondary',
  '1': 'outline',
};
