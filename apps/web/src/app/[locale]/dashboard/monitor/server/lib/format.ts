import { formatDuration as formatDateFnsDuration, intervalToDuration } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';

import type { HostInfo } from '../type';

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;
const DATE_TIME_FORMATTERS = new Map<string, Intl.DateTimeFormat>();

function getDateFnsLocale(locale?: string) {
  if (locale?.startsWith('zh')) {
    return zhCN;
  }
  return enUS;
}

function getDateTimeFormatter(locale?: string) {
  const normalizedLocale = locale ?? 'zh-CN';
  if (!DATE_TIME_FORMATTERS.has(normalizedLocale)) {
    DATE_TIME_FORMATTERS.set(
      normalizedLocale,
      new Intl.DateTimeFormat(normalizedLocale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Shanghai',
      }),
    );
  }
  return DATE_TIME_FORMATTERS.get(normalizedLocale)!;
}

export function formatBytes(value?: number, fractionDigits = 1) {
  if (typeof value !== 'number' || value <= 0) {
    return '-';
  }
  const power = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    BYTE_UNITS.length - 1,
  );
  const adjusted = value / Math.pow(1024, power);
  return `${adjusted.toFixed(fractionDigits)} ${BYTE_UNITS[power]}`;
}

export function formatPercent(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }
  return `${value.toFixed(1)}%`;
}

export function formatLoad(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0.00';
  }
  return value.toFixed(2);
}

export function safeNumber(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
}

export function formatDateTime(value?: number | string | Date | null, locale?: string) {
  if (value === undefined || value === null) {
    return '-';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return getDateTimeFormatter(locale).format(date);
}

export function formatDuration(
  seconds?: number,
  locale?: string,
  { lessThanMinuteText }: { lessThanMinuteText?: string } = {},
) {
  if (typeof seconds !== 'number' || seconds < 0) {
    return '-';
  }
  const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
  const localeData = getDateFnsLocale(locale);
  const formatted = formatDateFnsDuration(duration, {
    format: ['years', 'months', 'days', 'hours', 'minutes'],
    zero: false,
    delimiter: localeData === zhCN ? '' : ' ',
    locale: localeData,
  });
  const compact =
    localeData === zhCN ? formatted.replace(/\s+/g, '') : formatted.trim();
  return (
    compact ||
    lessThanMinuteText ||
    (localeData === zhCN ? '不足1分钟' : 'Less than 1 minute')
  );
}

export function formatServerSystem(host: HostInfo) {
  const platformName = host.platform?.trim();
  const platformVersion = host.platformVersion?.trim();
  const hasPlatformDetail = Boolean(platformName || platformVersion);
  const primary = hasPlatformDetail
    ? [platformName, platformVersion].filter(Boolean).join(' ')
    : host.os?.trim() || '';
  const arch = host.arch?.trim();
  if (primary && arch) {
    return `${primary} · ${arch}`;
  }
  return primary || arch || '-';
}
