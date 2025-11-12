'use client';

export const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export const DEFAULT_PAGINATION = {
  pageNum: 1,
  pageSize: PAGE_SIZE_OPTIONS[0],
};

export const TIME_RANGE_OPTIONS = [
  { value: 'all', label: '不限时间', minutes: undefined },
  { value: '1h', label: '最近 1 小时', minutes: 60 },
  { value: '6h', label: '最近 6 小时', minutes: 6 * 60 },
  { value: '24h', label: '最近 24 小时', minutes: 24 * 60 },
  { value: '7d', label: '最近 7 天', minutes: 7 * 24 * 60 },
] as const;

export type TimeRangeValue = (typeof TIME_RANGE_OPTIONS)[number]['value'];

export const DEFAULT_FILTERS = {
  userName: '',
  ipaddr: '',
  timeRange: 'all' as TimeRangeValue,
};

export const ONLINE_USERS_QUERY_KEY = ['monitor', 'online-users'] as const;

export const ONLINE_PERMISSION_CODES = {
  list: 'monitor:online:list',
  query: 'monitor:online:query',
  batchLogout: 'monitor:online:batchLogout',
  forceLogout: 'monitor:online:forceLogout',
} as const;
