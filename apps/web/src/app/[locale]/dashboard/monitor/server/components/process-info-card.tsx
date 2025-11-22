'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ServerCog } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { NumberTicker } from '@/components/number-ticker';

import { InfoRow } from './info-row';
import type { ProcessInfo } from '../type';
import { formatBytes, formatDateTime, formatDuration, formatPercent } from '../lib/format';

interface ProcessInfoCardProps {
  process: ProcessInfo;
}

export function ProcessInfoCard({ process }: ProcessInfoCardProps) {
  const t = useTranslations('ServerMonitor');
  const locale = useLocale();
  const processSummary = [
    {
      label: t('process.summary.version'),
      value: process.version?.trim() || 'N/A',
      align: 'left' as const,
      valueClassName: 'font-mono text-sm',
    },
    {
      label: t('process.summary.commit'),
      value: process.commit || '-',
      align: 'left' as const,
      valueClassName: 'font-mono text-xs leading-tight break-all',
    },
    {
      label: t('process.summary.pid'),
      value: process.pid > 0 ? `#${process.pid}` : '-',
    },
    {
      label: t('process.summary.startTime'),
      value: formatDateTime(process.startTime, locale),
    },
    {
      label: t('process.summary.uptime'),
      value:
        process.uptime ||
        formatDuration(process.uptimeSeconds, locale, {
          lessThanMinuteText: t('status.lessThanMinute'),
        }),
    },
    {
      label: t('process.summary.goVersion'),
      value: process.goVersion || '-',
    },
  ];

  const metrics = [
    { label: t('process.metrics.cpu'), value: process.cpuUsage, ticker: true, formatValue: formatPercent },
    { label: t('process.metrics.memory'), value: process.alloc, ticker: true, formatValue: formatBytes },
    { label: t('process.metrics.totalMemory'), value: process.totalAlloc, ticker: true, formatValue: formatBytes },
    { label: t('process.metrics.systemMemory'), value: process.sys, ticker: true, formatValue: formatBytes },
    { label: t('process.metrics.goroutines'), value: process.numGoroutine, ticker: true, formatValue: (v: number) => Math.max(0, Math.round(v)).toString() },
    { label: t('process.metrics.gcCount'), value: process.numGC, ticker: true, formatValue: (v: number) => Math.max(0, Math.round(v)).toString() },
    { label: t('process.metrics.lastGC'), value: process.lastGC || '-', valueClassName: 'font-mono text-xs break-all' },
    { label: t('process.metrics.nextGC'), value: process.nextGC, ticker: true, formatValue: formatBytes },
    { label: t('process.metrics.cgo'), value: process.numCgoCall, ticker: true, formatValue: (v: number) => Math.max(0, Math.round(v)).toString() },
  ];

  return (
    <Card className="h-full border-none shadow-none dark:border-border/40">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <ServerCog className="size-5 text-muted-foreground" />
          {t('process.title')}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {t('process.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:gap-2 sm:flex ">
        <div className="rounded-2xl border border-border/60 bg-muted/10 p-4 dark:border-border/30 min-w-[300px]">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('process.sections.deployment')}
          </p>
          <div className="mt-3 space-y-3">
            {processSummary.map((item) => (
              <InfoRow
                key={item.label}
                label={item.label}
                value={item.value}
                align={item.align}
                valueClassName={item.valueClassName}
              />
            ))}
          </div>
        </div>
        <div className="rounded-2xl flex-1 border border-border/60 p-4 dark:border-border/30">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('process.sections.metrics')}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {metrics.map((row) => (
              <InfoRow
                key={row.label}
                label={row.label}
                value={
                  row.ticker && typeof row.value === 'number' ? (
                    <NumberTicker
                      value={row.value}
                      formatValue={row.formatValue ?? ((val) => val.toFixed(0))}
                      className="font-semibold text-foreground"
                      snap={0.1}
                    />
                  ) : (
                    row.value
                  )
                }
                valueClassName={row.valueClassName}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
