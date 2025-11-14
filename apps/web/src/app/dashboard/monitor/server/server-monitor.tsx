'use client';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useQuery } from '@tanstack/react-query';
import { Cpu, HardDrive, MemoryStick, RefreshCcw } from 'lucide-react';
import { useMemo } from 'react';

import { getServerStatus } from './api';
import { QuickStatCard } from './components/quick-stat-card';
import { ProcessInfoCard } from './components/process-info-card';
import { ServerInfoCard } from './components/server-info-card';
import { formatBytes, formatLoad, formatPercent, safeNumber } from './lib/format';
import { DEFAULT_STATUS, summarizeDisks } from './lib/status';
import type { ServerStatus } from './type';

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

  const quickStats = useMemo(
    () => [
      {
        label: 'CPU',
        icon: Cpu,
        value: cpuUsagePercent,
        formatValue: formatPercent,
        hint: `Load ${formatLoad(normalizedStatus.cpu.load1)} / ${formatLoad(normalizedStatus.cpu.load5)} / ${formatLoad(normalizedStatus.cpu.load15)}`,
        percent: safeNumber(cpuUsagePercent),
      },
      {
        label: '内存',
        icon: MemoryStick,
        value: normalizedStatus.memory.usedPercent,
        formatValue: formatPercent,
        hint: `进程占用 ${formatBytes(normalizedStatus.memory.processAlloc || normalizedStatus.process.alloc)}`,
        percent: safeNumber(normalizedStatus.memory.usedPercent),
      },
      {
        label: '存储',
        icon: HardDrive,
        value: diskSummary.usedPercent,
        formatValue: formatPercent,
        hint: `${formatBytes(diskSummary.used)} / ${formatBytes(diskSummary.total)}`,
        percent: safeNumber(diskSummary.usedPercent),
      },
    ],
    [cpuUsagePercent, diskSummary, normalizedStatus],
  );

  if (query.isError) {
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            服务监控
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
          className="w-full md:w-auto"
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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickStats.map((stat) => (
          <QuickStatCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            hint={stat.hint}
            percent={stat.percent}
            formatValue={stat.formatValue}
          />
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.15fr]">
        <ServerInfoCard host={normalizedStatus.host} lastUpdated={lastUpdated} />
        <ProcessInfoCard process={normalizedStatus.process} />
      </section>
    </div>
  );
}
