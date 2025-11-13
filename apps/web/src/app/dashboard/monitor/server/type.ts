export interface HostInfo {
  hostname: string;
  os: string;
  arch: string;
  platform?: string;
  platformVersion?: string;
  uptime: string;
  uptimeSeconds: number;
  goVersion: string;
  kernelVersion?: string;
  currentTime: string;
}

export interface CPUInfo {
  cores: number;
  load1: number;
  load5: number;
  load15: number;
  usagePercent: number;
}

export interface MemoryInfo {
  total: number;
  free: number;
  used: number;
  usedPercent: number;
  processAlloc: number;
}

export interface DiskInfo {
  mountpoint: string;
  filesystem: string;
  total: number;
  free: number;
  used: number;
  usedPercent: number;
}

export interface ProcessInfo {
  pid: number;
  startTime: string;
  uptime: string;
  uptimeSeconds: number;
  goVersion: string;
  numGoroutine: number;
  alloc: number;
  totalAlloc: number;
  sys: number;
  numGC: number;
  lastGC: string;
  nextGC: number;
  cpuUsage: number;
  numCgoCall: number;
  version: string;
  commit: string;
}

export interface ServerStatus {
  host: HostInfo;
  cpu: CPUInfo;
  memory: MemoryInfo;
  disks: DiskInfo[];
  process: ProcessInfo;
}
