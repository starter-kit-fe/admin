'use client';

export const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export const DEFAULT_PAGINATION = {
  pageNum: 1,
  pageSize: PAGE_SIZE_OPTIONS[0],
};

export const DEFAULT_FILTERS = {
  userName: '',
  ipaddr: '',
};

export const ONLINE_USERS_QUERY_KEY = ['monitor', 'online-users'] as const;

export const ONLINE_PERMISSION_CODES = {
  list: 'monitor:online:list',
  query: 'monitor:online:query',
  batchLogout: 'monitor:online:batchLogout',
  forceLogout: 'monitor:online:forceLogout',
} as const;
