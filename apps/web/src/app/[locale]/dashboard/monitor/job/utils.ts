type Translator = (key: string, values?: Record<string, string | number>) => string;

export function resolveStatusLabel(
  tOrStatus: Translator | string | null | undefined,
  statusMaybe?: string | null,
) {
  const isTranslator = typeof tOrStatus === 'function';
  const status = isTranslator ? statusMaybe : tOrStatus;
  if (isTranslator) {
    const key = status === '0' ? 'status.0' : 'status.1';
    return (tOrStatus as Translator)(key);
  }
  return status === '0' ? '正常' : '暂停';
}

export function resolveMisfireLabel(
  tOrPolicy: Translator | string | null | undefined,
  policyMaybe?: string | null,
) {
  const isTranslator = typeof tOrPolicy === 'function';
  const policy = isTranslator ? policyMaybe : tOrPolicy;
  const key = policy || '3';
  return isTranslator
    ? (tOrPolicy as Translator)(`table.misfirePolicies.${key}`)
    : MISFIRE_FALLBACK[key as keyof typeof MISFIRE_FALLBACK] ??
        MISFIRE_FALLBACK['3'];
}

const MISFIRE_FALLBACK = {
  '1': '立即执行 - 错过后立即补执行',
  '2': '执行一次 - 错过后执行一次',
  '3': '放弃执行 - 等待下次调度',
};

const CONCURRENT_FALLBACK = {
  '0': '允许 - 可同时运行多个实例',
  '1': '禁止 - 同时只能运行一个实例',
};

export function resolveConcurrentLabel(
  tOrFlag: Translator | string | null | undefined,
  flagMaybe?: string | null,
) {
  const isTranslator = typeof tOrFlag === 'function';
  const flag = isTranslator ? flagMaybe : tOrFlag;
  const key = flag || '1';
  return isTranslator
    ? (tOrFlag as Translator)(`table.concurrent.${key}`)
    : CONCURRENT_FALLBACK[key as keyof typeof CONCURRENT_FALLBACK] ??
        CONCURRENT_FALLBACK['1'];
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
