export const CONFIG_TYPE_TABS = [
  { value: 'all', label: '全部' },
  { value: 'Y', label: '系统内置' },
  { value: 'N', label: '自定义' },
] as const;

export const BASE_QUERY_KEY = ['system', 'configs', 'list'] as const;
