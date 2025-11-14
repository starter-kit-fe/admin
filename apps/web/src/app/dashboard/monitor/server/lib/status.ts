import type { DiskInfo, ServerStatus } from '../type';

export const DEFAULT_STATUS: ServerStatus = {
  host: {
    hostname: '',
    os: '',
    arch: '',
    platform: '',
    platformVersion: '',
    uptime: '',
    uptimeSeconds: 0,
    goVersion: '',
    kernelVersion: '',
    currentTime: '',
  },
  cpu: {
    cores: 0,
    load1: 0,
    load5: 0,
    load15: 0,
    usagePercent: 0,
  },
  memory: {
    total: 0,
    free: 0,
    used: 0,
    usedPercent: 0,
    processAlloc: 0,
  },
  disks: [],
  process: {
    pid: 0,
    startTime: '',
    uptime: '',
    uptimeSeconds: 0,
    goVersion: '',
    numGoroutine: 0,
    alloc: 0,
    totalAlloc: 0,
    sys: 0,
    numGC: 0,
    lastGC: '',
    nextGC: 0,
    cpuUsage: 0,
    numCgoCall: 0,
    version: '',
    commit: '',
  },
};

export function summarizeDisks(disks: DiskInfo[]) {
  if (!Array.isArray(disks) || disks.length === 0) {
    return { total: 0, used: 0, free: 0, usedPercent: 0 };
  }
  const total = disks.reduce((sum, disk) => sum + (disk.total || 0), 0);
  const used = disks.reduce((sum, disk) => sum + (disk.used || 0), 0);
  const free = disks.reduce((sum, disk) => sum + (disk.free || 0), 0);
  const usedPercent = total > 0 ? (used / total) * 100 : 0;
  return { total, used, free, usedPercent };
}
