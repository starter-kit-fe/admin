'use client';

import { NumberTicker } from '@/components/number-ticker';
import { PermissionButton } from '@/components/permission-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertTriangle,
  Database,
  Gauge,
  HardDrive,
  Layers,
  RefreshCcw,
  Server,
  Users,
} from 'lucide-react';

import { useCacheOverviewStream } from '../hooks/use-cache-overview-stream';
import type { CacheKeyspaceInfo, CacheOverview } from '../type';
import {
  formatBytes,
  formatNumber,
  formatPercent,
  safeMemoryGauge,
  summarizeKeys,
} from '../utils';

function MetaPill({
  icon: Icon,
  label,
  value,
  formatValue,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  formatValue: (value: number) => string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border/70 px-4 py-1.5 text-sm text-foreground dark:border-border/50">
      <Icon className="size-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <NumberTicker
        value={value}
        formatValue={formatValue}
        className="font-semibold text-foreground"
        snap={0.5}
      />
    </div>
  );
}

function getMemoryTone(percent: number) {
  const baseTheme = {
    backdrop:
      'bg-gradient-to-br from-transparent via-primary/12 to-transparent',
    fill: 'bg-primary/10 from-transparent via-primary/35 to-transparent',
    badge: 'bg-primary/15 text-primary',
  };

  if (percent >= 85) {
    return {
      ...baseTheme,
      fill: 'bg-primary/20 from-transparent via-primary/45 to-transparent',
      badge: 'bg-primary/20 text-primary',
    };
  }

  if (percent >= 65) {
    return {
      ...baseTheme,
      fill: 'bg-primary/15 from-transparent via-primary/40 to-transparent',
    };
  }

  return baseTheme;
}

const safeNumber = (value?: number | null) =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

export function CacheDashboard() {
  const t = useTranslations('CacheMonitor');
  const stream = useCacheOverviewStream();
  const overview = stream.overview;

  const totalKeys = summarizeKeys(overview.keyspace ?? []);
  const usedMemory = safeNumber(overview.memory.usedMemory);
  const maxMemory = safeNumber(overview.memory.maxMemory);
  const peakMemory = safeNumber(overview.memory.usedMemoryPeak);
  const fragmentationRatio = safeNumber(overview.memory.fragmentationRatio);
  const memoryUsagePercent = safeMemoryGauge(usedMemory, maxMemory);
  const memoryTone = getMemoryTone(memoryUsagePercent);
  const memoryFillWidth = `${Math.min(100, Math.max(0, memoryUsagePercent))}%`;
  const memoryLimitLabel =
    maxMemory > 0
      ? formatBytes(maxMemory, { decimals: 1 })
      : overview.memory.maxMemoryHuman ?? t('dashboard.overview.memory.noLimit');
  const memoryPeakLabel =
    overview.memory.usedMemoryPeakHuman ??
    formatBytes(peakMemory, {
      decimals: 1,
    });

  const formatTimestamp = (value?: number | null) => {
    if (!value || Number.isNaN(value)) {
      return t('dashboard.header.waitingStream');
    }
    try {
      return new Date(value).toLocaleString();
    } catch {
      return t('dashboard.header.waitingStream');
    }
  };

  const hitRate = safeNumber(overview.stats.hitRate);
  const opsPerSec = safeNumber(overview.stats.instantaneousOps);

  const metaItems = [
    {
      icon: Database,
      label: t('dashboard.meta.keys'),
      value: totalKeys,
      formatValue: (val: number) => formatNumber(Math.max(0, Math.round(val))),
    },
    {
      icon: Gauge,
      label: t('dashboard.meta.hitRate'),
      value: hitRate,
      formatValue: (val: number) =>
        formatPercent(Math.max(0, Math.min(100, val))),
    },
    {
      icon: Activity,
      label: t('dashboard.meta.ops'),
      value: opsPerSec,
      formatValue: (val: number) => formatNumber(Math.max(0, Math.round(val))),
    },
  ];

  const hitCount = safeNumber(overview.stats.keyspaceHits);
  const missCount = safeNumber(overview.stats.keyspaceMisses);
  const expiredKeys = safeNumber(overview.stats.expiredKeys);
  const evictedKeys = safeNumber(overview.stats.evictedKeys);
  const connectedClients = safeNumber(overview.clients.connected);
  const blockedClients = safeNumber(overview.clients.blocked);
  const serverFields = [
    {
      label: t('dashboard.server.fields.mode'),
      value: overview.server.mode || t('common.unknown'),
    },
    {
      label: t('dashboard.server.fields.role'),
      value: overview.server.role || t('common.unknown'),
    },
    {
      label: t('dashboard.server.fields.version'),
      value: overview.server.version || t('common.unknown'),
    },
    {
      label: t('dashboard.server.fields.uptime'),
      value: overview.server.uptime || t('common.unknown'),
    },
  ];

  const connectionBadgeClass = stream.isConnected
    ? 'bg-primary/15 text-primary'
    : 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100';
  const connectionLabel = stream.isConnected
    ? t('dashboard.header.connection.live')
    : t('dashboard.header.connection.waiting');
  const isConnecting =
    stream.isLoading || (!stream.isConnected && stream.error === null);

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <Card className="shadow-none border-none">
        <CardHeader className="space-y-4 lg:flex lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold">
              {t('dashboard.header.title')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.header.description')}
            </CardDescription>
            <div className="flex flex-wrap gap-2">
              {metaItems.map((item) => (
                <MetaPill
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                  formatValue={item.formatValue}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 text-xs text-muted-foreground lg:items-end">
            <div
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold',
                connectionBadgeClass,
              )}
            >
              <span
                className={cn(
                  'inline-block size-2.5 rounded-full',
                  stream.isConnected
                    ? 'bg-primary animate-pulse'
                    : 'bg-amber-500',
                )}
              />
              {connectionLabel}
            </div>
            <div>
              {t('dashboard.header.updatedAt', {
                time: formatTimestamp(stream.lastUpdated),
              })}
            </div>
            <PermissionButton
              required="monitor:cache:list"
              type="button"
              variant="outline"
              className="gap-2"
              onClick={stream.reconnect}
              disabled={stream.isLoading}
            >
              {isConnecting ? (
                <>
                  <Spinner className="size-4" />
                  {t('dashboard.header.actions.connecting')}
                </>
              ) : (
                <>
                  <RefreshCcw className="size-4" />
                  {t('dashboard.header.actions.reconnect')}
                </>
              )}
            </PermissionButton>
          </div>
        </CardHeader>
        {stream.error !== null && !stream.isConnected ? (
          <CardContent>
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="size-4" />
              {stream.error || t('dashboard.error.overview')}
            </div>
          </CardContent>
        ) : null}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-none border-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {t('dashboard.overview.title')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.overview.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl border border-border/50  p-4  transition-colors dark:border-border/30">
              <div
                aria-hidden
                className={cn(
                  'pointer-events-none absolute inset-0 opacity-80',
                  memoryTone.backdrop,
                )}
              />
              <div className="relative space-y-3">
                <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                  <span className="flex items-center gap-2">
                    <HardDrive className="size-4 text-muted-foreground" />
                    {t('dashboard.overview.memory.label')}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-semibold uppercase',
                      memoryTone.badge,
                    )}
                  >
                    <NumberTicker
                      value={memoryUsagePercent}
                      formatValue={(val) =>
                        formatPercent(Math.max(0, Math.min(100, val)))
                      }
                      snap={0.1}
                    />
                  </span>
                </div>
                <div className="flex flex-col gap-4 text-xs uppercase tracking-wide text-muted-foreground sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-2">
                    <div>{t('dashboard.overview.memory.used')}</div>
                    <NumberTicker
                      value={usedMemory}
                      formatValue={(val) => formatBytes(val, { decimals: 1 })}
                      className="text-lg font-semibold text-foreground"
                    />
                    <div className="text-muted-foreground">
                      {t('dashboard.overview.memory.peak')} {memoryPeakLabel}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground">
                      {t('dashboard.overview.memory.limit')}
                    </div>
                    <div className="text-sm font-semibold text-foreground">
                      {memoryLimitLabel}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('dashboard.overview.memory.fragmentation')}{' '}
                      <NumberTicker
                        value={fragmentationRatio}
                        formatValue={(val) => formatPercent(val)}
                        className="font-semibold text-foreground"
                        snap={0.05}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div className="rounded-xl border border-border/50 p-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Users className="size-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">
                    {t('dashboard.overview.clients.title')}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-xs uppercase tracking-wide">
                  <div className="flex items-center justify-between">
                    <span>{t('dashboard.overview.clients.connected')}</span>
                    <NumberTicker
                      value={connectedClients}
                      formatValue={(val) =>
                        formatNumber(Math.max(0, Math.round(val)))
                      }
                      className="text-foreground"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('dashboard.overview.clients.blocked')}</span>
                    <NumberTicker
                      value={blockedClients}
                      formatValue={(val) =>
                        formatNumber(Math.max(0, Math.round(val)))
                      }
                      className="text-foreground"
                    />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border/50 p-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Layers className="size-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">
                    {t('dashboard.overview.stats.title')}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-xs uppercase tracking-wide">
                  <div className="flex items-center justify-between">
                    <span>{t('dashboard.overview.stats.hits')}</span>
                    <NumberTicker
                      value={hitCount}
                      formatValue={(val) =>
                        formatNumber(Math.max(0, Math.round(val)))
                      }
                      className="text-foreground"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('dashboard.overview.stats.misses')}</span>
                    <NumberTicker
                      value={missCount}
                      formatValue={(val) =>
                        formatNumber(Math.max(0, Math.round(val)))
                      }
                      className="text-foreground"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('dashboard.overview.stats.expired')}</span>
                    <NumberTicker
                      value={expiredKeys}
                      formatValue={(val) =>
                        formatNumber(Math.max(0, Math.round(val)))
                      }
                      className="text-foreground"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('dashboard.overview.stats.evicted')}</span>
                    <NumberTicker
                      value={evictedKeys}
                      formatValue={(val) =>
                        formatNumber(Math.max(0, Math.round(val)))
                      }
                      className="text-foreground"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none border-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {t('dashboard.server.title')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.server.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/50 p-4">
              {serverFields.map((item) => (
                <div key={item.label} className={cn('space-y-1')}>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-border/50 p-4">
              <div className="flex items-center gap-2 text-foreground">
                <Server className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold">
                  {t('dashboard.server.persistence.title')}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs uppercase tracking-wide">
                <div>
                  <div className="text-muted-foreground">
                    {t('dashboard.server.persistence.lastRdb')}
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {overview.persistence.rdbLastSaveTime ||
                      t('common.notExecuted')}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">
                    {t('dashboard.server.persistence.status')}
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {overview.persistence.rdbLastStatus || t('common.unknown')}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">
                    {t('dashboard.server.persistence.pending')}
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {formatNumber(
                      overview.persistence.rdbChangesSinceLastSave || 0,
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">
                    {t('dashboard.server.persistence.aof')}
                  </div>
                  <div
                    className={cn(
                      'text-sm font-medium',
                      overview.persistence.aofEnabled
                        ? 'text-primary'
                        : 'text-muted-foreground',
                    )}
                  >
                    {overview.persistence.aofEnabled
                      ? t('common.enabled')
                      : t('common.disabled')}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none border-none px-2 py-3">
        <CardHeader className="">
          <CardTitle className="text-lg font-semibold">
            {t('dashboard.keyspace.title')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.keyspace.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {overview.keyspace && overview.keyspace.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 font-medium">
                      {t('dashboard.keyspace.table.db')}
                    </th>
                    <th className="py-2 font-medium">
                      {t('dashboard.keyspace.table.keys')}
                    </th>
                    <th className="py-2 font-medium">
                      {t('dashboard.keyspace.table.expires')}
                    </th>
                    <th className="py-2 font-medium">
                      {t('dashboard.keyspace.table.avgTtl')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {overview.keyspace.map((space) => {
                    const avgTTL =
                      typeof space.avgTtl === 'number' && space.avgTtl > 0
                        ? `${Math.round(space.avgTtl / 1000)}s`
                        : t('common.unknown');
                    return (
                      <tr key={space.db} className="text-sm">
                        <td className="py-2 font-medium text-foreground">
                          {typeof space.db === 'string'
                            ? space.db.toUpperCase()
                            : '-'}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {formatNumber(space.keys)}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {formatNumber(space.expires)}
                        </td>
                        <td className="py-2 text-muted-foreground">{avgTTL}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty className="min-h-[160px] border border-dashed border-border/60 bg-muted/40">
              <EmptyHeader>
                <EmptyTitle>{t('dashboard.keyspace.emptyTitle')}</EmptyTitle>
                <EmptyDescription>
                  {t('dashboard.keyspace.emptyDescription')}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
