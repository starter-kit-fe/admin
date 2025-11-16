'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useQuery } from '@tanstack/react-query';
import { Cpu, HardDrive, MemoryStick, RefreshCcw } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { getServerStatus } from './api';
import { ProcessInfoCard } from './components/process-info-card';
import { QuickStatCard } from './components/quick-stat-card';
import { ServerInfoCard } from './components/server-info-card';
import {
  formatBytes,
  formatLoad,
  formatPercent,
  safeNumber,
} from './lib/format';
import { DEFAULT_STATUS, summarizeDisks } from './lib/status';
import type { ServerStatus } from './type';

export function ServerMonitor() {
  const tHeader = useTranslations('ServerMonitor.header');
  const tStatus = useTranslations('ServerMonitor.status');
  const tQuickStats = useTranslations('ServerMonitor.quickStats');
  const tError = useTranslations('ServerMonitor.error');
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
      return tStatus('never');
    }
    try {
      return new Date(query.dataUpdatedAt || Date.now()).toLocaleString();
    } catch {
      return tStatus('justNow');
    }
  }, [status, query.dataUpdatedAt, tStatus]);

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
    () => {
      const load1 = formatLoad(normalizedStatus.cpu.load1);
      const load5 = formatLoad(normalizedStatus.cpu.load5);
      const load15 = formatLoad(normalizedStatus.cpu.load15);
      const processAlloc = formatBytes(
        normalizedStatus.memory.processAlloc || normalizedStatus.process.alloc,
      );
      const diskUsed = formatBytes(diskSummary.used);
      const diskTotal = formatBytes(diskSummary.total);

      return [
        {
          label: tQuickStats('cpu.label'),
          icon: Cpu,
          value: cpuUsagePercent,
          formatValue: formatPercent,
          hint: tQuickStats('cpu.hint', {
            load1,
            load5,
            load15,
          }),
          percent: safeNumber(cpuUsagePercent),
        },
        {
          label: tQuickStats('memory.label'),
          icon: MemoryStick,
          value: normalizedStatus.memory.usedPercent,
          formatValue: formatPercent,
          hint: tQuickStats('memory.hint', {
            allocation: processAlloc,
          }),
          percent: safeNumber(normalizedStatus.memory.usedPercent),
        },
        {
          label: tQuickStats('storage.label'),
          icon: HardDrive,
          value: diskSummary.usedPercent,
          formatValue: formatPercent,
          hint: tQuickStats('storage.hint', {
            used: diskUsed,
            total: diskTotal,
          }),
          percent: safeNumber(diskSummary.usedPercent),
        },
      ];
    },
    [cpuUsagePercent, diskSummary, normalizedStatus, tQuickStats],
  );

  if (query.isError) {
    return (
      <Card className="border-destructive/40 bg-destructive/10 text-destructive">
        <CardHeader>
          <CardTitle className="text-lg">{tError('title')}</CardTitle>
          <CardDescription className="text-destructive/80">
            {tError('description')}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-6 px-3 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {tHeader('title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {tHeader('description')}
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
              {tHeader('refreshing')}
            </>
          ) : (
            <>
              <RefreshCcw className="mr-2 size-4" />
              {tHeader('refreshNow')}
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
        <ServerInfoCard
          host={normalizedStatus.host}
          lastUpdated={lastUpdated}
        />
        <ProcessInfoCard process={normalizedStatus.process} />
      </section>
    </div>
  );
}
