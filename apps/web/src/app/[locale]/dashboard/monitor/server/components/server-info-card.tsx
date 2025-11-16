'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MonitorSmartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { HostInfo } from '../type';
import { formatDuration, formatServerSystem } from '../lib/format';
import { InfoRow } from './info-row';

interface ServerInfoCardProps {
  host: HostInfo;
  lastUpdated: string;
}

export function ServerInfoCard({ host, lastUpdated }: ServerInfoCardProps) {
  const tServerInfo = useTranslations('ServerMonitor.serverInfo');
  const rows = [
    { label: tServerInfo('rows.name'), value: host.hostname || '-' },
    {
      label: tServerInfo('rows.system'),
      value: formatServerSystem(host),
    },
    {
      label: tServerInfo('rows.uptime'),
      value: host.uptime || formatDuration(host.uptimeSeconds),
    },
    { label: tServerInfo('rows.goRuntime'), value: host.goVersion || '-' },
    { label: tServerInfo('rows.kernel'), value: host.kernelVersion || '-' },
    { label: tServerInfo('rows.currentTime'), value: host.currentTime || '-' },
  ];

  return (
    <Card className="h-full border-none shadow-none dark:border-border/40">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <MonitorSmartphone className="size-5 text-muted-foreground" />
          {tServerInfo('title')}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {tServerInfo('description', { time: lastUpdated })}
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
