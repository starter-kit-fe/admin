export function formatBytes(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return '-';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const power = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  );
  const adjusted = value / Math.pow(1024, power);
  return `${adjusted.toFixed(power === 0 ? 0 : 2)} ${units[power]}`;
}

export function formatDuration(seconds?: number | null) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) {
    return '未知';
  }
  if (seconds < 0) {
    return '永久';
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
