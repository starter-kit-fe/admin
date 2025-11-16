import type { StatusTabItem } from '@/components/status-tabs';

export const STATUS_TABS = [
  { value: 'all', labelKey: 'statusTabs.all' },
  { value: '0', labelKey: 'statusTabs.0' },
  { value: '1', labelKey: 'statusTabs.1' },
] as const satisfies Array<{ value: StatusTabItem['value']; labelKey: string }>;
