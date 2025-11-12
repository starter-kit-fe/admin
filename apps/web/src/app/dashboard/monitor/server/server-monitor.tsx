'use client';

import { InlineLoading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { useQuery } from '@tanstack/react-query';
import {
  Cpu,
  Database,
  HardDrive,
  MemoryStick,
  MonitorSmartphone,
  RefreshCcw,
  ServerCog,
} from 'lucide-react';
import { useMemo } from 'react';
import type { ReactNode } from 'react';

import { getServerStatus } from './api';
import type { DiskInfo, HostInfo, ProcessInfo, ServerStatus } from './type';

function formatBytes(value?: number, fractionDigits = 1) {
  if (typeof value !== 'number' || value <= 0) {
    return '-';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let power = Math.floor(Math.log(value) / Math.log(1024));
  power = Math.min(power, units.length - 1);
  const adjusted = value / Math.pow(1024, power);
  return `${adjusted.toFixed(fractionDigits)} ${units[power]}`;
}

function formatPercent(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }
  return `${value.toFixed(1)}%`;
}

function formatLoad(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0.00';
  }
  return value.toFixed(2);
}

function safeNumber(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
}

function formatDuration(seconds?: number) {
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

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-sm font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

function ServerInfoCard({
  host,
  version,
  commit,
  lastUpdated,
  onRefresh,
  isRefreshing,
}: {
  host: HostInfo;
  version: string;
  commit: string;
  lastUpdated: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const rows = [
    { label: '主机名', value: host.hostname || '-' },
    {
      label: '系统',
      value: [host.os, host.arch].filter(Boolean).join('/') || '-',
    },
    { label: '内核版本', value: host.kernelVersion || '-' },
    {
      label: '运行时长',
      value: host.uptime || formatDuration(host.uptimeSeconds),
    },
    { label: '当前时间', value: host.currentTime || '-' },
  ];

  const versionBadges = [
    { label: '后端版本', value: version || 'N/A' },
    { label: 'Commit', value: commit || '-' },
  ];

  return (
    <Card className="h-full border-border/70 dark:border-border/40">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <MonitorSmartphone className="size-5 text-muted-foreground" />
          服务器与版本
        </CardTitle>
        <CardDescription>主机环境与版本号集中展示</CardDescription>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-4 text-sm text-muted-foreground">
        <div className="space-y-2">
          {rows.map((row) => (
            <InfoRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          {versionBadges.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border/60 bg-background/70 p-4 font-mono text-base text-foreground dark:border-border/40 dark:bg-muted/30"
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-1 break-all">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-auto flex flex-col gap-2 text-xs uppercase tracking-wide text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="normal-case">最近更新时间：{lastUpdated}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-full sm:w-auto"
          >
            {isRefreshing ? (
              <>
                <Spinner className="mr-2 size-4" />
                刷新中
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 size-4" />
                刷新
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ProcessInfoCard({ process }: { process: ProcessInfo }) {
  const rows = [
    {
      label: 'PID',
      value: <Badge variant="secondary">{process.pid}</Badge>,
    },
    { label: 'Go 版本', value: process.goVersion || '-' },
    { label: '启动时间', value: process.startTime || '-' },
    {
      label: '运行时长',
      value: process.uptime || formatDuration(process.uptimeSeconds),
    },
    { label: 'CPU 占用', value: formatPercent(process.cpuUsage) },
    { label: '内存占用', value: formatBytes(process.alloc) },
    { label: 'Goroutines', value: process.numGoroutine.toString() },
    { label: 'GC 次数', value: process.numGC.toString() },
    { label: '最后 GC', value: process.lastGC || '-' },
    { label: '下一次 GC 目标', value: formatBytes(process.nextGC) },
    { label: 'Cgo 调用', value: process.numCgoCall.toString() },
  ];

  return (
    <Card className="h-full border-border/70 dark:border-border/40">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <ServerCog className="size-5 text-muted-foreground" />
          后台程序
        </CardTitle>
        <CardDescription>运行中的进程核心指标</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((row) => (
          <InfoRow key={row.label} label={row.label} value={row.value} />
        ))}
      </CardContent>
    </Card>
  );
}

function MetricCard({
  title,
  icon: Icon,
  highlight,
  meta,
  progress,
  rows,
}: {
  title: string;
  icon: typeof Cpu;
  highlight: string;
  meta: string;
  progress: number;
  rows: { label: string; value: ReactNode }[];
}) {
  return (
    <Card className="h-full border-border/70 dark:border-border/40">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2 text-foreground">
          <span className="flex size-8 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
            <Icon className="size-4" />
          </span>
          <div className="flex flex-col">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <CardDescription>{meta}</CardDescription>
          </div>
        </div>
        <span className="text-xl font-semibold text-foreground">
          {highlight}
        </span>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <Progress value={progress} aria-label={`${title} 使用比例`} />
        <div className="space-y-2">
          {rows.map((row) => (
            <InfoRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CpuCard({ status }: { status: ServerStatus }) {
  const { cpu, process } = status;
  const cpuUsagePercent =
    typeof process.cpuUsage === 'number' && !Number.isNaN(process.cpuUsage)
      ? process.cpuUsage
      : cpu.usagePercent;

  return (
    <MetricCard
      title="CPU"
      icon={Cpu}
      highlight={formatPercent(cpuUsagePercent)}
      meta={`${Math.max(cpu.cores, 0)} 核心`}
      progress={safeNumber(cpuUsagePercent)}
      rows={[
        {
          label: '1/5/15 分钟负载',
          value: `${formatLoad(cpu.load1)} / ${formatLoad(cpu.load5)} / ${formatLoad(cpu.load15)}`,
        },
      ]}
    />
  );
}

function MemoryCard({ status }: { status: ServerStatus }) {
  const { memory, process } = status;
  return (
    <MetricCard
      title="内存"
      icon={MemoryStick}
      highlight={formatPercent(memory.usedPercent)}
      meta={`总量 ${formatBytes(memory.total)}`}
      progress={safeNumber(memory.usedPercent)}
      rows={[
        { label: '已用', value: formatBytes(memory.used) },
        { label: '可用', value: formatBytes(memory.free) },
        {
          label: '后台程序占用',
          value: formatBytes(memory.processAlloc || process.alloc),
        },
      ]}
    />
  );
}

function summarizeDisks(disks: DiskInfo[]) {
  if (!Array.isArray(disks) || disks.length === 0) {
    return { total: 0, used: 0, free: 0, usedPercent: 0 };
  }
  const total = disks.reduce((sum, disk) => sum + (disk.total || 0), 0);
  const used = disks.reduce((sum, disk) => sum + (disk.used || 0), 0);
  const free = disks.reduce((sum, disk) => sum + (disk.free || 0), 0);
  const usedPercent = total > 0 ? (used / total) * 100 : 0;
  return { total, used, free, usedPercent };
}

function StorageCard({ disks }: { disks: DiskInfo[] }) {
  const summary = useMemo(() => summarizeDisks(disks), [disks]);

  return (
    <Card className="h-full border-border/70 dark:border-border/40">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Database className="size-5 text-muted-foreground" />
          存储
        </CardTitle>
        <CardDescription>磁盘容量与占用概览</CardDescription>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-4 text-sm text-muted-foreground">
        <div>
          <div className="flex items-center justify-between text-xs uppercase tracking-wide">
            <span className="text-muted-foreground">整体使用率</span>
            <span className="text-foreground">
              {formatPercent(summary.usedPercent)}
            </span>
          </div>
          <Progress
            value={safeNumber(summary.usedPercent)}
            aria-label="磁盘整体使用率"
          />
          <div className="mt-3 space-y-2 text-sm">
            <InfoRow label="总量" value={formatBytes(summary.total)} />
            <InfoRow label="已用" value={formatBytes(summary.used)} />
            <InfoRow label="剩余" value={formatBytes(summary.free)} />
          </div>
        </div>
        <div className="space-y-2">
          {disks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
              未检测到可用磁盘信息
            </div>
          ) : (
            disks.map((disk) => (
              <div
                key={`${disk.mountpoint}-${disk.filesystem}`}
                className="space-y-2 rounded-2xl border border-border/50 p-3 dark:border-border/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-foreground">
                    <HardDrive className="size-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">
                      {disk.mountpoint || '/'}
                    </span>
                  </div>
                  <Badge variant="outline">{disk.filesystem || '未知'}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs uppercase tracking-wide">
                  <span className="text-muted-foreground">
                    {formatBytes(disk.used)} / {formatBytes(disk.total)}
                  </span>
                  <span className="text-foreground">
                    {formatPercent(disk.usedPercent)}
                  </span>
                </div>
                <Progress
                  value={safeNumber(disk.usedPercent)}
                  aria-label={`${disk.mountpoint} 使用率`}
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const DEFAULT_STATUS: ServerStatus = {
  host: {
    hostname: '',
    os: '',
    arch: '',
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

export function ServerMonitor() {
  const query = useQuery({
    queryKey: ['monitor', 'server-status'],
    queryFn: getServerStatus,
    refetchInterval: 30_000,
  });

  const status = query.data;

  const normalizedStatus = useMemo<ServerStatus>(() => {
    if (!status) {
      return DEFAULT_STATUS;
    }
    return {
      host: status.host ?? DEFAULT_STATUS.host,
      cpu: status.cpu ?? DEFAULT_STATUS.cpu,
      memory: status.memory ?? DEFAULT_STATUS.memory,
      disks: status.disks ?? DEFAULT_STATUS.disks,
      process: status.process ?? DEFAULT_STATUS.process,
    };
  }, [status]);

  const disks = useMemo(() => normalizedStatus.disks ?? [], [normalizedStatus]);
  const lastUpdated = useMemo(() => {
    if (!status) {
      return '尚未获取';
    }
    try {
      return new Date(query.dataUpdatedAt || Date.now()).toLocaleString();
    } catch {
      return '刚刚';
    }
  }, [status, query.dataUpdatedAt]);

  const backendVersion =
    normalizedStatus.process.version?.trim() || 'N/A';
  const backendCommit =
    normalizedStatus.process.commit?.trim() || '-';

  if (query.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <InlineLoading label="加载服务监控..." />
      </div>
    );
  }

  if (query.isError || !status) {
    return (
      <Card className="border-destructive/40 bg-destructive/10 text-destructive">
        <CardHeader>
          <CardTitle className="text-lg">无法加载服务监控数据</CardTitle>
          <CardDescription className="text-destructive/80">
            请稍后刷新重试。
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-3 py-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MonitorSmartphone className="size-4" />
          服务监控
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          服务监控
        </h1>
        <p className="text-sm text-muted-foreground">
          顶部聚合主机与进程细节，下方单行呈现 CPU、内存与存储指标，保证页面一次看全。
        </p>
      </div>

      <div className="grid flex-1 gap-5 lg:grid-cols-2">
        <ServerInfoCard
          host={normalizedStatus.host}
          version={backendVersion}
          commit={backendCommit}
          lastUpdated={lastUpdated}
          onRefresh={() => void query.refetch()}
          isRefreshing={query.isFetching}
        />
        <ProcessInfoCard process={normalizedStatus.process} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <CpuCard status={normalizedStatus} />
        <MemoryCard status={normalizedStatus} />
        <StorageCard disks={disks} />
      </div>
    </div>
  );
}
