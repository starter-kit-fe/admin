export const NOTICE_STATUS_TABS = [
  { value: 'all', labelKey: 'statusTabs.all', color: 'bg-slate-900 text-white' },
  { value: '0', labelKey: 'statusTabs.0', color: 'bg-emerald-500 text-white' },
  { value: '1', labelKey: 'statusTabs.1', color: 'bg-rose-500 text-white' },
] as const;

export const NOTICE_TYPE_OPTIONS = [
  { value: 'all', labelKey: 'typeOptions.all' },
  { value: '1', labelKey: 'typeOptions.1' },
  { value: '2', labelKey: 'typeOptions.2' },
] as const;

export const BASE_NOTICE_QUERY_KEY = ['system', 'notices', 'list'] as const;

export const DEFAULT_DEBOUNCE_MS = 300;
