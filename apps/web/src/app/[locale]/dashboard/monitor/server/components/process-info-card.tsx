'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ServerCog } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { InfoRow } from './info-row';
import type { ProcessInfo } from '../type';
import { formatBytes, formatDuration, formatPercent } from '../lib/format';

interface ProcessInfoCardProps {
  process: ProcessInfo;
}

export function ProcessInfoCard({ process }: ProcessInfoCardProps) {
  const tProcess = useTranslations('ServerMonitor.process');
  const tStatus = useTranslations('ServerMonitor.status');
  const processSummary = [
    {
      label: tProcess('summary.version'),
      value: process.version?.trim() || 'N/A',
      align: 'left' as const,
      valueClassName: 'font-mono text-sm',
    },
    {
      label: tProcess('summary.commit'),
      value: process.commit || '-',
      align: 'left' as const,
      valueClassName: 'font-mono text-xs leading-tight break-all',
    },
    {
      label: tProcess('summary.pid'),
      value: process.pid > 0 ? `#${process.pid}` : '-',
    },
    {
      label: tProcess('summary.startTime'),
      value: process.startTime || tStatus('never'),
    },
    {
      label: tProcess('summary.uptime'),
      value: process.uptime || formatDuration(process.uptimeSeconds),
    },
    {
      label: tProcess('summary.goVersion'),
      value: process.goVersion || '-',
    },
  ];

  const metrics = [
    { label: tProcess('metrics.cpu'), value: formatPercent(process.cpuUsage) },
    { label: tProcess('metrics.memory'), value: formatBytes(process.alloc) },
    {
      label: tProcess('metrics.totalMemory'),
      value: formatBytes(process.totalAlloc),
    },
    {
      label: tProcess('metrics.systemMemory'),
      value: formatBytes(process.sys),
    },
    {
      label: tProcess('metrics.goroutines'),
      value: process.numGoroutine.toString(),
    },
    { label: tProcess('metrics.gcCount'), value: process.numGC.toString() },
    { label: tProcess('metrics.lastGC'), value: process.lastGC || '-' },
    {
      label: tProcess('metrics.nextGC'),
      value: formatBytes(process.nextGC),
    },
    { label: tProcess('metrics.cgo'), value: process.numCgoCall.toString() },
  ];

  return (
    <Card className="h-full border-none shadow-none dark:border-border/40">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <ServerCog className="size-5 text-muted-foreground" />
          {tProcess('title')}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {tProcess('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-border/60 bg-muted/10 p-4 dark:border-border/30">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {tProcess('sections.deployment')}
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
        <div className="rounded-2xl border border-border/60 p-4 dark:border-border/30">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {tProcess('sections.metrics')}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((row) => (
              <InfoRow key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
