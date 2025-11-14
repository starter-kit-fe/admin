import type { HostInfo } from '../type';

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;

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

export function formatDuration(seconds?: number) {
  if (typeof seconds !== 'number' || seconds < 0) {
    return '-';
  }
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (hrs > 0) parts.push(`${hrs}h`);
  if (mins > 0) parts.push(`${mins}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  return parts.join(' ');
}

export function formatServerSystem(host: HostInfo) {
  const platformName = host.platform?.trim();
  const platformVersion = host.platformVersion?.trim();
  const hasPlatformDetail = Boolean(platformName || platformVersion);
  const primary = hasPlatformDetail
    ? [platformName, platformVersion].filter(Boolean).join(' ')
    : host.os?.trim() || '';
  const kernel = host.kernelVersion?.trim();
  const arch = host.arch?.trim();
  const descriptor = [primary, kernel].filter(Boolean).join(' · ');
  if (descriptor && arch) {
    return `${descriptor} (${arch})`;
  }
  return descriptor || arch || '-';
}
