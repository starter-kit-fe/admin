'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MonitorSmartphone } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import type { HostInfo } from '../type';
import { formatDateTime, formatDuration, formatServerSystem } from '../lib/format';
import { InfoRow } from './info-row';

interface ServerInfoCardProps {
  host: HostInfo;
  lastUpdated: string;
}

export function ServerInfoCard({ host, lastUpdated }: ServerInfoCardProps) {
  const t = useTranslations('ServerMonitor');
  const locale = useLocale();

  const rows = [
    { label: t('serverInfo.rows.name'), value: host.hostname || '-' },
    {
      label: t('serverInfo.rows.system'),
      value: formatServerSystem(host),
    },
    {
      label: t('serverInfo.rows.uptime'),
      value:
        host.uptime ||
        formatDuration(host.uptimeSeconds, locale, {
          lessThanMinuteText: t('status.lessThanMinute'),
        }),
    },
    {
      label: t('serverInfo.rows.bootTime'),
      value: formatDateTime(host.bootTime, locale),
    },
    { label: t('serverInfo.rows.currentTime'), value: formatDateTime(host.currentTime, locale) },
  ];

  return (
    <Card className="h-full border-none shadow-none dark:border-border/40">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <MonitorSmartphone className="size-5 text-muted-foreground" />
          {t('serverInfo.title')}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {t('serverInfo.description', { time: lastUpdated })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-4 text-sm text-muted-foreground">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-1">
          {rows.map((row) => (
            <InfoRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
