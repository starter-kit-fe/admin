import { CONCURRENT_LABELS, MISFIRE_POLICY_LABELS } from './constants';

export function resolveStatusLabel(status?: string | null) {
  return status === '0' ? '正常' : '暂停';
}

export function resolveMisfireLabel(policy?: string | null) {
  if (!policy) {
    return MISFIRE_POLICY_LABELS['3'];
  }
  return MISFIRE_POLICY_LABELS[policy] ?? MISFIRE_POLICY_LABELS['3'];
}

export function resolveConcurrentLabel(flag?: string | null) {
  if (!flag) {
    return CONCURRENT_LABELS['1'];
  }
  return CONCURRENT_LABELS[flag] ?? CONCURRENT_LABELS['1'];
}

export function stringifyInvokeParams(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }
    try {
      const parsed = JSON.parse(trimmed);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return trimmed;
    }
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
