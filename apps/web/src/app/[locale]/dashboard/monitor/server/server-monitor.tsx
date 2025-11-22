'use client';

import { useMemo } from 'react';
import { Cpu, HardDrive, MemoryStick, RefreshCcw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

import { QuickStatCard } from './components/quick-stat-card';
import { ProcessInfoCard } from './components/process-info-card';
import { ServerInfoCard } from './components/server-info-card';
import {
  formatBytes,
  formatDateTime,
  formatLoad,
  formatPercent,
  safeNumber,
} from './lib/format';
import { DEFAULT_STATUS, summarizeDisks } from './lib/status';
import { useServerStatusStream } from './hooks/use-server-status-stream';

export function ServerMonitor() {
  const t = useTranslations('ServerMonitor');
  const locale = useLocale();
  const stream = useServerStatusStream({
    locale,
    lessThanMinuteText: t('status.lessThanMinute'),
    connectionErrorText: t('error.description'),
  });
  const status = stream.status ?? DEFAULT_STATUS;

  const diskSummary = useMemo(
    () => summarizeDisks(status.disks ?? []),
    [status.disks],
  );

  const lastUpdated = useMemo(() => {
    if (!stream.lastUpdated) {
      return t('status.never');
    }
    try {
      return formatDateTime(stream.lastUpdated, locale);
    } catch {
      return t('status.justNow');
    }
  }, [locale, stream.lastUpdated, t]);

  const cpuUsagePercent = useMemo(() => {
    const { cpu } = status;
    if (typeof cpu.usagePercent === 'number' && !Number.isNaN(cpu.usagePercent)) {
      return cpu.usagePercent;
    }
    return 0;
  }, [status]);

  const quickStats = useMemo(
    () => [
      {
        label: t('quickStats.cpu.label'),
        icon: Cpu,
        value: cpuUsagePercent,
        formatValue: formatPercent,
        hint: t('quickStats.cpu.hint', {
          load1: formatLoad(status.cpu.load1),
          load5: formatLoad(status.cpu.load5),
          load15: formatLoad(status.cpu.load15),
        }),
        percent: safeNumber(cpuUsagePercent),
      },
      {
        label: t('quickStats.memory.label'),
        icon: MemoryStick,
        value: status.memory.usedPercent,
        formatValue: formatPercent,
        hint: t('quickStats.memory.hint', {
          limit: formatBytes(status.memory.limit),
          allocation: formatBytes(status.memory.processAlloc || status.process.alloc),
        }),
        percent: safeNumber(status.memory.usedPercent),
      },
      {
        label: t('quickStats.storage.label'),
        icon: HardDrive,
        value: diskSummary.usedPercent,
        formatValue: formatPercent,
        hint: t('quickStats.storage.hint', {
          used: formatBytes(diskSummary.used),
          total: formatBytes(diskSummary.total),
        }),
        percent: safeNumber(diskSummary.usedPercent),
      },
    ],
    [
      cpuUsagePercent,
      diskSummary.total,
      diskSummary.used,
      diskSummary.usedPercent,
      status.cpu.load1,
      status.cpu.load15,
      status.cpu.load5,
      status.memory.limit,
      status.memory.processAlloc,
      status.memory.usedPercent,
      status.process.alloc,
      t,
    ],
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t('header.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('header.description')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 ">
          <span
            className={`ml-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${stream.isConnected ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}
          >
            <span
              className={`inline-block size-2.5 rounded-full ${stream.isConnected ? 'bg-primary animate-pulse' : 'bg-muted-foreground/50'}`}
            />
            {stream.isConnected ? t('status.live') : t('status.disconnected')}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={stream.reconnect}
            disabled={stream.isLoading}
            className="md:w-auto"
          >
            {stream.isLoading ? (
              <>
                <Spinner className="mr-2 size-4" />
                {t('actions.reconnecting')}
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 size-4" />
                {t('actions.reconnect')}
              </>
            )}
          </Button>
        </div>
      </div>

      {!stream.isConnected && stream.error ? (
        <Card className="border-destructive/40 bg-destructive/10 text-destructive">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">{t('error.title')}</CardTitle>
            <CardDescription className="text-destructive/80">
              {stream.error || t('error.description')}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-3">
          {quickStats.map((stat) => (
            <QuickStatCard
              key={stat.label}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              hint={stat.hint}
              percent={stat.percent}
              formatValue={stat.formatValue}
              className="h-full"
            />
          ))}
        </div>
        <ServerInfoCard host={status.host} lastUpdated={lastUpdated} />
      </section>
      <section>
        <ProcessInfoCard process={status.process} />
      </section>
    </div>
  );
}
