'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ServerCog } from 'lucide-react';

import { InfoRow } from './info-row';
import type { ProcessInfo } from '../type';
import { formatBytes, formatDuration, formatPercent } from '../lib/format';

interface ProcessInfoCardProps {
  process: ProcessInfo;
}

export function ProcessInfoCard({ process }: ProcessInfoCardProps) {
  const processSummary = [
    {
      label: '版本号',
      value: process.version?.trim() || 'N/A',
      align: 'left' as const,
      valueClassName: 'font-mono text-sm',
    },
    {
      label: 'Commit',
      value: process.commit || '-',
      align: 'left' as const,
      valueClassName: 'font-mono text-xs leading-tight break-all',
    },
    {
      label: 'PID',
      value: process.pid > 0 ? `#${process.pid}` : '-',
    },
    {
      label: '启动时间',
      value: process.startTime || '未获取',
    },
    {
      label: '进程运行时长',
      value: process.uptime || formatDuration(process.uptimeSeconds),
    },
    {
      label: 'Go 版本',
      value: process.goVersion || '-',
    },
  ];

  const metrics = [
    { label: 'CPU 占用', value: formatPercent(process.cpuUsage) },
    { label: '内存占用', value: formatBytes(process.alloc) },
    { label: '累计内存', value: formatBytes(process.totalAlloc) },
    { label: '系统内存', value: formatBytes(process.sys) },
    { label: 'Goroutines', value: process.numGoroutine.toString() },
    { label: 'GC 次数', value: process.numGC.toString() },
    { label: '最后 GC', value: process.lastGC || '-' },
    { label: '下一次 GC', value: formatBytes(process.nextGC) },
    { label: 'Cgo 调用', value: process.numCgoCall.toString() },
  ];

  return (
    <Card className="h-full border-none shadow-none dark:border-border/40">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <ServerCog className="size-5 text-muted-foreground" />
          后端进程
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          展示部署版本 / Commit 以及 Go 进程的 CPU、内存与 GC 行为。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-border/60 bg-muted/10 p-4 dark:border-border/30">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            部署信息
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
            运行指标
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
