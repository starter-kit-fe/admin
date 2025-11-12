export const BASE_QUERY_KEY = ['monitor', 'jobs'] as const;

export const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: '0', label: '正常' },
  { value: '1', label: '暂停' },
] as const;

export type JobStatusFilter =
  (typeof STATUS_FILTER_OPTIONS)[number]['value'];

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

export const MISFIRE_POLICY_LABELS: Record<string, string> = {
  '1': '立即执行',
  '2': '执行一次',
  '3': '放弃执行',
};

export const CONCURRENT_LABELS: Record<string, string> = {
  '0': '允许',
  '1': '禁止',
};
