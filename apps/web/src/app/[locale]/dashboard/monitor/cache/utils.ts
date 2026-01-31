import { CacheKeyspaceInfo, CacheMemoryInfo, CacheOverview } from './api/type';

type FormatBytesOptions = {
  decimals?: number;
  smallUnitDecimals?: number;
};

export function formatBytes(
  value?: number | null,
  options: FormatBytesOptions = {},
) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return '-';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const power = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  );
  const decimals =
    power === 0 ? (options.smallUnitDecimals ?? 0) : (options.decimals ?? 2);
  const adjusted = value / Math.pow(1024, power);
  return `${adjusted.toFixed(decimals)} ${units[power]}`;
}

export function formatPercent(value?: number | null, fractionDigits = 1) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '0%';
  }
  return `${value.toFixed(fractionDigits)}%`;
}

export function formatNumber(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '0';
  }
  return new Intl.NumberFormat().format(value);
}

export function safeMemoryGauge(used?: number, max?: number) {
  if (typeof used !== 'number' || used < 0) {
    return 0;
  }
  if (typeof max !== 'number' || max <= 0) {
    return Math.min(100, (used / (512 * 1024 * 1024)) * 100);
  }
  return Math.min(100, (used / max) * 100);
}

export function summarizeKeys(keyspace: CacheKeyspaceInfo[]) {
  if (!Array.isArray(keyspace) || keyspace.length === 0) {
    return 0;
  }
  return keyspace.reduce((total, item) => total + (item?.keys ?? 0), 0);
}

type DurationLabels = {
  unknown?: string;
  permanent?: string;
};

export function formatDuration(
  seconds?: number | null,
  labels: DurationLabels = {},
) {
  const unknownLabel = labels.unknown ?? 'Unknown';
  const permanentLabel = labels.permanent ?? 'Permanent';
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) {
    return unknownLabel;
  }
  if (seconds < 0) {
    return permanentLabel;
  }
  if (seconds < 60) {
    return `${seconds}s`;
  }
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
}
