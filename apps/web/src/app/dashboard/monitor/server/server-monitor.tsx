'use client';

import { useMemo } from 'react';
import type { ReactNode } from 'react';
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

import { InlineLoading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';

import { getServerStatus } from './api';
import type { DiskInfo, ServerStatus } from './type';

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
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function DiskItem({ disk }: { disk: DiskInfo }) {
  const usedPercent = safeNumber(disk.usedPercent);
  return (
    <div className="rounded-xl border border-border/60 bg-card/80 p-4 dark:border-border/40 dark:bg-muted/20">
      <div className="flex items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <HardDrive className="size-4 text-muted-foreground" />
          {disk.mountpoint || '/'}
        </div>
        <Badge variant="outline">{disk.filesystem || '未知'}</Badge>
      </div>
      <Progress value={usedPercent} aria-label="磁盘占用比例" />
      <div className="mt-3 grid grid-cols-2 gap-y-1 text-sm">
        <span className="text-muted-foreground">容量</span>
        <span className="text-right font-medium text-foreground">{formatBytes(disk.total)}</span>
        <span className="text-muted-foreground">已用</span>
        <span className="text-right font-medium text-foreground">{formatBytes(disk.used)}</span>
        <span className="text-muted-foreground">剩余</span>
        <span className="text-right font-medium text-foreground">{formatBytes(disk.free)}</span>
        <span className="text-muted-foreground">占用</span>
        <span className="text-right font-medium text-foreground">{formatPercent(disk.usedPercent)}</span>
      </div>
    </div>
  );
}

function ResourceCard({ status }: { status: ServerStatus }) {
  const { cpu, memory, process } = status;

  const sections = [
    {
      key: 'cpu',
      title: 'CPU',
      icon: Cpu,
      highlight: formatPercent(cpu.usagePercent),
      meta: `${Math.max(cpu.cores, 0)} 核心`,
      progress: safeNumber(cpu.usagePercent),
      rows: [
        { label: '1/5/15 分钟负载', value: `${formatLoad(cpu.load1)} / ${formatLoad(cpu.load5)} / ${formatLoad(cpu.load15)}` },
        { label: '后台程序 CPU', value: formatPercent(process.cpuUsage) },
      ],
    },
    {
      key: 'memory',
      title: '内存',
      icon: MemoryStick,
      highlight: formatPercent(memory.usedPercent),
      meta: `总量 ${formatBytes(memory.total)}`,
      progress: safeNumber(memory.usedPercent),
      rows: [
        { label: '已用', value: formatBytes(memory.used) },
        { label: '可用', value: formatBytes(memory.free) },
        { label: '后台程序占用', value: formatBytes(memory.processAlloc || process.alloc) },
      ],
    },
  ];

  return (
    <Card className="border-border/70 shadow-sm dark:border-border/40">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg font-semibold">资源使用概览</CardTitle>
        <CardDescription>即刻掌握 CPU 与内存的运行态势</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.key}
              className="space-y-4 rounded-3xl bg-muted/25 p-5 shadow-inner backdrop-blur-sm transition-colors dark:bg-muted/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground">
                  <span className="flex size-8 items-center justify-center rounded-full bg-background/70 text-muted-foreground shadow-sm dark:bg-muted/40">
                    <Icon className="size-4" />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{section.title}</span>
                    <span className="text-xs text-muted-foreground">{section.meta}</span>
                  </div>
                </div>
                <span className="text-lg font-semibold text-foreground">{section.highlight}</span>
              </div>
              <Progress value={section.progress} aria-label={`${section.title} 使用比例`} />
              <div className="space-y-2 text-xs uppercase tracking-wide text-muted-foreground">
                {section.rows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3 text-xs font-medium normal-case">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="text-right text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function SystemInfoCard({ status }: { status: ServerStatus }) {
  const { host, process } = status;

  const sections = [
    {
      key: 'host',
      title: '服务器',
      icon: MonitorSmartphone,
      rows: [
        { label: '主机名', value: host.hostname || '-' },
        { label: '系统', value: [host.os, host.arch].filter(Boolean).join('/') || '-' },
        { label: '内核版本', value: host.kernelVersion || '-' },
        { label: '运行时长', value: host.uptime || formatDuration(host.uptimeSeconds) },
        { label: '当前时间', value: host.currentTime || '-' },
      ],
    },
    {
      key: 'process',
      title: '后台程序',
      icon: ServerCog,
      rows: [
        { label: 'PID', value: <Badge variant="secondary">{process.pid}</Badge> },
        { label: '启动时间', value: process.startTime || '-' },
        { label: '运行时长', value: process.uptime || formatDuration(process.uptimeSeconds) },
        { label: 'CPU 占用', value: formatPercent(process.cpuUsage) },
        { label: '内存占用', value: formatBytes(process.alloc) },
        { label: 'Goroutines', value: process.numGoroutine.toString() },
        { label: 'GC 次数', value: process.numGC.toString() },
        { label: '最后 GC', value: process.lastGC || '-' },
        { label: '下一次 GC 目标', value: formatBytes(process.nextGC) },
      ],
    },
  ];

  return (
    <Card className="border-border/70 shadow-sm dark:border-border/40">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg font-semibold">系统与后台程序</CardTitle>
        <CardDescription>把核心状态归类呈现，更快定位问题</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.key}
              className="space-y-3 rounded-3xl border border-border/50 bg-background/60 p-5 shadow-sm dark:border-border/40 dark:bg-muted/25"
            >
              <div className="flex items-center gap-2 text-foreground">
                <span className="flex size-8 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
                  <Icon className="size-4" />
                </span>
                <span className="text-sm font-semibold">{section.title}</span>
              </div>
              <div className="space-y-2">
                {section.rows.map((row) => (
                  <InfoRow key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
            </div>
          );
        })}
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

  const cpuUsageLabel = formatPercent(normalizedStatus.cpu.usagePercent);
  const memoryUsageLabel = formatPercent(normalizedStatus.memory.usedPercent);
  const uptimeLabel =
    normalizedStatus.process.uptime || formatDuration(normalizedStatus.process.uptimeSeconds);

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
          <CardDescription className="text-destructive/80">请稍后刷新重试。</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
      <Card className="border-border/60 bg-card/90 shadow-sm dark:border-border/40">
        <CardContent className="flex flex-col gap-4 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MonitorSmartphone className="size-4" />
              {normalizedStatus.host.hostname || '未命名主机'} · {normalizedStatus.host.os}/
              {normalizedStatus.host.arch}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">服务监控</h1>
            <p className="text-sm text-muted-foreground">实时掌握服务器、磁盘与后台程序的关键指标。</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                CPU {cpuUsageLabel}
              </div>
              <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-600 dark:text-emerald-400">
                可用内存 {formatBytes(normalizedStatus.memory.free)}
              </div>
              <div className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-600 dark:text-amber-400">
                已运行 {uptimeLabel}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 text-xs text-muted-foreground lg:items-end">
            <span>最近更新时间：{lastUpdated}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
              className="w-full sm:w-auto"
            >
              {query.isFetching ? (
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

      <ResourceCard status={normalizedStatus} />
      <SystemInfoCard status={normalizedStatus} />

      <Card className="border-border/70 shadow-sm dark:border-border/40">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="size-5 text-muted-foreground" />
            存储磁盘
          </CardTitle>
          <CardDescription>挂载卷的容量与使用情况</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {disks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
              未检测到可用磁盘信息
            </div>
          ) : (
            disks.map((disk) => <DiskItem key={`${disk.mountpoint}-${disk.filesystem}`} disk={disk} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
