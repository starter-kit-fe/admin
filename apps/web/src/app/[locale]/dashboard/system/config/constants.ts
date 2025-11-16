import type { StatusTabItem } from '@/components/status-tabs';

export const CONFIG_TYPE_TABS = [
  { value: 'all', labelKey: 'statusTabs.all' },
  { value: 'Y', labelKey: 'statusTabs.Y' },
  { value: 'N', labelKey: 'statusTabs.N' },
] as const satisfies Array<{ value: StatusTabItem['value']; labelKey: string }>;

export const BASE_QUERY_KEY = ['system', 'configs', 'list'] as const;
