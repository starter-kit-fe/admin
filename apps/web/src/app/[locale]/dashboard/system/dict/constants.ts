export const TYPE_STATUS_TABS = [
  { value: 'all', labelKey: 'status.all' },
  { value: '0', labelKey: 'status.0' },
  { value: '1', labelKey: 'status.1' },
] as const;

export const DATA_STATUS_TABS = TYPE_STATUS_TABS;

export const BASE_TYPE_QUERY_KEY = ['system', 'dicts', 'types'] as const;
export const BASE_DATA_QUERY_KEY = ['system', 'dicts', 'data'] as const;

export const DEFAULT_DEBOUNCE_MS = 300;
