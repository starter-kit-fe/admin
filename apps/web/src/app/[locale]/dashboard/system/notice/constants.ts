export const NOTICE_STATUS_TABS = [
  { value: 'all', labelKey: 'filters.statusTabs.all', color: 'bg-slate-900 text-white' },
  { value: '0', labelKey: 'filters.statusTabs.0', color: 'bg-emerald-500 text-white' },
  { value: '1', labelKey: 'filters.statusTabs.1', color: 'bg-rose-500 text-white' },
] as const;

export const NOTICE_TYPE_OPTIONS = [
  { value: 'all', labelKey: 'filters.typeOptions.all' },
  { value: '1', labelKey: 'filters.typeOptions.1' },
  { value: '2', labelKey: 'filters.typeOptions.2' },
] as const;

export const BASE_NOTICE_QUERY_KEY = ['system', 'notices', 'list'] as const;

export const DEFAULT_DEBOUNCE_MS = 300;
