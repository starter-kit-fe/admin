export const BASE_QUERY_KEY = ['system', 'configs', 'list'] as const;

export const CONFIG_TYPE_TABS = [
  { value: 'all', labelKey: 'filters.statusTabs.all' },
  { value: 'Y', labelKey: 'filters.statusTabs.Y' },
  { value: 'N', labelKey: 'filters.statusTabs.N' },
] as const;
