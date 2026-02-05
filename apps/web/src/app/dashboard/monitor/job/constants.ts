export const BASE_QUERY_KEY = ['monitor', 'jobs'] as const;

export const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export const STATUS_TABS = [
  { value: 'all', label: '全部' },
  { value: '0', label: '正常' },
  { value: '1', label: '暂停' },
] as const;

export type JobStatusFilter = (typeof STATUS_TABS)[number]['value'];

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
  '1': '立即执行 - 错过后立即补执行',
  '2': '执行一次 - 错过后执行一次',
  '3': '放弃执行 - 等待下次调度',
};

export const CONCURRENT_LABELS: Record<string, string> = {
  '0': '允许 - 可同时运行多个实例',
  '1': '禁止 - 同时只能运行一个实例',
};
