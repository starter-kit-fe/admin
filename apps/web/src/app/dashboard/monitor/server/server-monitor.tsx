'use client';

import { InlineLoading } from '@/components/loading';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useQuery } from '@tanstack/react-query';
import gsap from 'gsap';
import {
  Cpu,
  HardDrive,
  MemoryStick,
  MonitorSmartphone,
  RefreshCcw,
  ServerCog,
} from 'lucide-react';
import { useLayoutEffect, useMemo, useRef } from 'react';
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

function QuickStat({
  icon: Icon,
  label,
  value,
  hint,
  percent,
}: {
  icon: typeof Cpu;
  label: string;
  value: string;
  hint: string;
  percent: number;
}) {
  const barRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = barRef.current;
    if (!node) {
      return;
    }
    const ctx = gsap.context(() => {
      gsap.to(node, {
        width: `${Math.max(0, Math.min(100, percent))}%`,
        duration: 0.8,
        ease: 'power2.out',
      });
    }, node);
    return () => {
      ctx.revert();
    };
  }, [percent]);

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/80 px-4 py-3 dark:border-border/30">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground">
          <Icon className="size-5" />
        </span>
        <div className="flex flex-1 flex-col">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <span className="text-lg font-semibold text-foreground">{value}</span>
          <span className="text-xs text-muted-foreground/80">{hint}</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-muted/40">
        <div
          ref={barRef}
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
      </div>
    </div>
  );
}

function ServerInfoCard({
  host,
  lastUpdated,
}: {
  host: HostInfo;
  lastUpdated: string;
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

  return (
    <Card className="h-full border-border/70 dark:border-border/40">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <MonitorSmartphone className="size-5 text-muted-foreground" />
          服务器与版本
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          最近更新：{lastUpdated}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-4 text-sm text-muted-foreground">
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <InfoRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ProcessInfoCard({ process }: { process: ProcessInfo }) {
  const highlights = [
    {
      label: 'PID',
      value: process.pid > 0 ? `#${process.pid}` : '-',
      hint: process.startTime || '未获取',
    },
    {
      label: '后端版本',
      value: process.version?.trim() || 'N/A',
      hint: `Commit: ${process.commit?.slice(0, 7) || '-'}`,
    },
    {
      label: 'Go 版本',
      value: process.goVersion || '-',
      hint: `下一次 GC：${formatBytes(process.nextGC)}`,
    },
    {
      label: '运行时长',
      value: process.uptime || formatDuration(process.uptimeSeconds),
      hint: `最后 GC：${process.lastGC || '-'}`,
    },
  ];

  const metrics = [
    { label: 'CPU 占用', value: formatPercent(process.cpuUsage) },
    { label: '内存占用', value: formatBytes(process.alloc) },
    { label: '累计内存', value: formatBytes(process.totalAlloc) },
    { label: 'Goroutines', value: process.numGoroutine.toString() },
    { label: 'GC 次数', value: process.numGC.toString() },
    { label: 'Cgo 调用', value: process.numCgoCall.toString() },
  ];

  return (
    <Card className="h-full border-border/70 dark:border-border/40">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <ServerCog className="size-5 text-muted-foreground" />
          后端进程
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          以 Go 进程为核心，聚焦 CPU、内存与 GC 行为。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border/60 bg-muted/20 p-4 dark:border-border/30"
            >
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <p className="text-lg font-semibold text-foreground">
                {item.value}
              </p>
              <p className="text-xs text-muted-foreground">{item.hint}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-3 grid-cols-2">
          {metrics.map((row) => (
            <InfoRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      </CardContent>
    </Card>
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

  const diskSummary = useMemo(
    () => summarizeDisks(normalizedStatus.disks ?? []),
    [normalizedStatus],
  );
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

  const cpuUsagePercent = useMemo(() => {
    const { cpu, process } = normalizedStatus;
    if (
      typeof process.cpuUsage === 'number' &&
      !Number.isNaN(process.cpuUsage)
    ) {
      return process.cpuUsage;
    }
    return cpu.usagePercent;
  }, [normalizedStatus]);

  const quickStats = [
    {
      label: 'CPU',
      icon: Cpu,
      value: formatPercent(cpuUsagePercent),
      hint: `Load ${formatLoad(normalizedStatus.cpu.load1)} / ${formatLoad(normalizedStatus.cpu.load5)} / ${formatLoad(normalizedStatus.cpu.load15)}`,
      percent: safeNumber(cpuUsagePercent),
    },
    {
      label: '内存',
      icon: MemoryStick,
      value: formatPercent(normalizedStatus.memory.usedPercent),
      hint: `进程占用 ${formatBytes(normalizedStatus.memory.processAlloc || normalizedStatus.process.alloc)}`,
      percent: safeNumber(normalizedStatus.memory.usedPercent),
    },
    {
      label: '存储',
      icon: HardDrive,
      value: formatPercent(diskSummary.usedPercent),
      hint: `${formatBytes(diskSummary.used)} / ${formatBytes(diskSummary.total)}`,
      percent: safeNumber(diskSummary.usedPercent),
    },
  ];

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
    <div className="mx-auto flex w-full flex-col gap-6 sm:gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            后台服务状态
          </h1>
          <p className="text-sm text-muted-foreground">
            聚焦后台服务器程序，CPU / 内存 / 存储。
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
          className="self-start md:self-auto"
        >
          {query.isFetching ? (
            <>
              <Spinner className="mr-2 size-4" />
              刷新中
            </>
          ) : (
            <>
              <RefreshCcw className="mr-2 size-4" />
              立即刷新
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickStats.map((stat) => (
          <QuickStat
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            hint={stat.hint}
            percent={stat.percent}
          />
        ))}
      </div>
      <div className="grid flex-1 gap-5 lg:grid-cols-[1fr_1.6fr]">
        <ServerInfoCard
          host={normalizedStatus.host}
          lastUpdated={lastUpdated}
        />
        <ProcessInfoCard process={normalizedStatus.process} />
      </div>
    </div>
  );
}
