import type { StatusTabItem } from '@/components/status-tabs';

export const CONFIG_TYPE_TABS: StatusTabItem[] = [
  { value: 'all', label: '全部' },
  { value: 'Y', label: '系统内置' },
  { value: 'N', label: '自定义' },
];

export const BASE_QUERY_KEY = ['system', 'configs', 'list'] as const;
