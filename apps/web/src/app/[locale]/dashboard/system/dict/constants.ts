import type { StatusTabItem } from '@/components/status-tabs';

export const TYPE_STATUS_TABS: StatusTabItem[] = [
  { value: 'all', label: '全部' },
  { value: '0', label: '正常' },
  { value: '1', label: '停用' },
];

export const DATA_STATUS_TABS: StatusTabItem[] = TYPE_STATUS_TABS;

export const BASE_TYPE_QUERY_KEY = ['system', 'dicts', 'types'] as const;
export const BASE_DATA_QUERY_KEY = ['system', 'dicts', 'data'] as const;

export const DEFAULT_DEBOUNCE_MS = 300;
