'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MonitorSmartphone } from 'lucide-react';

import type { HostInfo } from '../type';
import { formatDuration, formatServerSystem } from '../lib/format';
import { InfoRow } from './info-row';

interface ServerInfoCardProps {
  host: HostInfo;
  lastUpdated: string;
}

export function ServerInfoCard({ host, lastUpdated }: ServerInfoCardProps) {
  const rows = [
    { label: '服务器名称', value: host.hostname || '-' },
    {
      label: '服务器系统',
      value: formatServerSystem(host),
    },
    {
      label: '服务器运行时长',
      value: host.uptime || formatDuration(host.uptimeSeconds),
    },
    { label: 'Go 运行时', value: host.goVersion || '-' },
    { label: '内核版本', value: host.kernelVersion || '-' },
    { label: '当前时间', value: host.currentTime || '-' },
  ];

  return (
    <Card className="h-full border-none shadow-none dark:border-border/40">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <MonitorSmartphone className="size-5 text-muted-foreground" />
          服务器与版本
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          服务器级别的信息（区别于进程运行时），最近更新：{lastUpdated}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-4 text-sm text-muted-foreground">
        <div className="space-y-3">
          {rows.map((row) => (
            <InfoRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
