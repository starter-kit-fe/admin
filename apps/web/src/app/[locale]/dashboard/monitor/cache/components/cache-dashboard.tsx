'use client';

import { useQuery } from '@tanstack/react-query';
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
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

import { getCacheOverview } from '../api';
import type { CacheKeyspaceInfo, CacheOverview } from '../api/types';
import {
  formatBytes,
  formatNumber,
  formatPercent,
  safeMemoryGauge,
  summarizeKeys,
} from '../utils';

const DEFAULT_OVERVIEW: CacheOverview = {
  server: {},
  clients: {},
  memory: {},
  stats: {},
  persistence: {},
  keyspace: [],
};

function formatTimestamp(value?: number, fallback = '') {
  if (!value || Number.isNaN(value)) {
    return fallback;
  }
  return new Date(value).toLocaleString();
}

function MetaPill({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border/70 px-4 py-1.5 text-sm text-foreground dark:border-border/50">
      <Icon className="size-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function CacheDashboard() {
  const tDashboard = useTranslations('CacheMonitor.dashboard');
  const tCommon = useTranslations('CacheMonitor.common');
  const overviewQuery = useQuery({
    queryKey: ['monitor', 'cache', 'overview'],
    queryFn: getCacheOverview,
    refetchInterval: 30_000,
  });

  const overview = overviewQuery.data ?? DEFAULT_OVERVIEW;
  const totalKeys = summarizeKeys(overview.keyspace ?? []);

  const memoryUsagePercent = safeMemoryGauge(
    overview.memory.usedMemory,
    overview.memory.maxMemory,
  );
  const memoryUsageLabel =
    overview.memory.maxMemory && overview.memory.maxMemory > 0
      ? `${formatBytes(overview.memory.usedMemory, {
          decimals: 1,
        })} / ${formatBytes(overview.memory.maxMemory, { decimals: 1 })}`
      : overview.memory.usedMemoryHuman ??
        formatBytes(overview.memory.usedMemory, { decimals: 1 });
  const hitRate = formatPercent(overview.stats.hitRate);
  const opsPerSec = overview.stats.instantaneousOps ?? 0;

  const metaItems = [
    {
      icon: Database,
      key: 'keys',
      label: tDashboard('meta.keys'),
      value: formatNumber(totalKeys),
    },
    {
      icon: Gauge,
      key: 'hitRate',
      label: tDashboard('meta.hitRate'),
      value: hitRate,
    },
    {
      icon: Activity,
      key: 'ops',
      label: tDashboard('meta.ops'),
      value: formatNumber(opsPerSec),
    },
  ];

  const serverMeta = [
    {
      label: tDashboard('server.fields.mode'),
      value: overview.server.mode || tCommon('unknown'),
    },
    {
      label: tDashboard('server.fields.role'),
      value: overview.server.role || tCommon('unknown'),
    },
    {
      label: tDashboard('server.fields.version'),
      value: overview.server.version || '-',
    },
    {
      label: tDashboard('server.fields.uptime'),
      value: overview.server.uptime || '-',
    },
  ];

  const renderKeyspaceRow = (space: CacheKeyspaceInfo) => {
    const avgTTL =
      typeof space.avgTtl === 'number' && space.avgTtl > 0
        ? `${Math.round(space.avgTtl / 1000)}s`
        : tCommon('unknown');
    return (
      <tr key={space.db} className="text-sm">
        <td className="py-2 font-medium text-foreground">
          {space.db.toUpperCase()}
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
  };

  const refreshOverview = () => {
    void overviewQuery.refetch();
  };

  const isRefreshing = overviewQuery.isFetching;
  const updatedLabel = tDashboard('header.updatedAt', {
    time: formatTimestamp(overviewQuery.dataUpdatedAt, tCommon('justNow')),
  });

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <Card className="border-border/70 bg-card/90 dark:border-border/40">
        <CardHeader className="space-y-4 lg:flex lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold">
              {tDashboard('header.title')}
            </CardTitle>
            <CardDescription>
              {tDashboard('header.description')}
            </CardDescription>
            <div className="flex flex-wrap gap-2">
              {metaItems.map((item) => (
                <MetaPill
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 text-xs text-muted-foreground lg:items-end">
            <div>{updatedLabel}</div>
            <PermissionButton
              required="monitor:cache:list"
              type="button"
              variant="outline"
              className="gap-2"
              onClick={refreshOverview}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <Spinner className="size-4" />
                  {tDashboard('header.refreshing')}
                </>
              ) : (
                <>
                  <RefreshCcw className="size-4" />
                  {tDashboard('header.refresh')}
                </>
              )}
            </PermissionButton>
          </div>
        </CardHeader>
        {overviewQuery.isError ? (
          <CardContent>
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="size-4" />
              {tDashboard('error.overview')}
            </div>
          </CardContent>
        ) : null}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/70 dark:border-border/40">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {tDashboard('overview.title')}
            </CardTitle>
            <CardDescription>
              {tDashboard('overview.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 rounded-xl border border-border/50 p-4">
              <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                <span className="flex items-center gap-2">
                  <HardDrive className="size-4 text-muted-foreground" />
                  {tDashboard('overview.memory.label')}
                </span>
                <span>{memoryUsageLabel}</span>
              </div>
              <Progress
                value={memoryUsagePercent}
                aria-label={tDashboard('overview.memory.aria')}
              />
              <div className="grid grid-cols-2 gap-y-2 text-xs uppercase tracking-wide text-muted-foreground">
                <span>{tDashboard('overview.memory.peak')}</span>
                <span className="text-right text-foreground">
                  {overview.memory.usedMemoryPeakHuman ??
                    formatBytes(overview.memory.usedMemoryPeak, {
                      decimals: 1,
                    })}
                </span>
                <span>{tDashboard('overview.memory.fragmentation')}</span>
                <span className="text-right text-foreground">
                  {formatPercent(overview.memory.fragmentationRatio)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div className="rounded-xl border border-border/50 p-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Users className="size-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">
                    {tDashboard('overview.clients.title')}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-xs uppercase tracking-wide">
                  <div className="flex items-center justify-between">
                    <span>{tDashboard('overview.clients.connected')}</span>
                    <span className="text-foreground">
                      {formatNumber(overview.clients.connected)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{tDashboard('overview.clients.blocked')}</span>
                    <span className="text-foreground">
                      {formatNumber(overview.clients.blocked)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border/50 p-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Layers className="size-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">
                    {tDashboard('overview.stats.title')}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-xs uppercase tracking-wide">
                  <div className="flex items-center justify-between">
                    <span>{tDashboard('overview.stats.hits')}</span>
                    <span className="text-foreground">
                      {formatNumber(overview.stats.keyspaceHits)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{tDashboard('overview.stats.misses')}</span>
                    <span className="text-foreground">
                      {formatNumber(overview.stats.keyspaceMisses)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{tDashboard('overview.stats.expired')}</span>
                    <span className="text-foreground">
                      {formatNumber(overview.stats.expiredKeys)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{tDashboard('overview.stats.evicted')}</span>
                    <span className="text-foreground">
                      {formatNumber(overview.stats.evictedKeys)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 dark:border-border/40">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {tDashboard('server.title')}
            </CardTitle>
            <CardDescription>
              {tDashboard('server.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/50 p-4">
              {serverMeta.map((item) => (
                <div key={item.label} className="space-y-1">
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
                  {tDashboard('server.persistence.title')}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs uppercase tracking-wide">
                <div>
                  <div className="text-muted-foreground">
                    {tDashboard('server.persistence.lastRdb')}
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {overview.persistence.rdbLastSaveTime ||
                      tCommon('notExecuted')}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">
                    {tDashboard('server.persistence.status')}
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {overview.persistence.rdbLastStatus || tCommon('unknown')}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">
                    {tDashboard('server.persistence.pending')}
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {formatNumber(overview.persistence.rdbChangesSinceLastSave)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">
                    {tDashboard('server.persistence.aof')}
                  </div>
                  <div
                    className={cn(
                      'text-sm font-medium',
                      overview.persistence.aofEnabled
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-muted-foreground',
                    )}
                  >
                    {overview.persistence.aofEnabled
                      ? tCommon('enabled')
                      : tCommon('disabled')}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 dark:border-border/40">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg font-semibold">
            {tDashboard('keyspace.title')}
          </CardTitle>
          <CardDescription>{tDashboard('keyspace.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {overview.keyspace && overview.keyspace.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 font-medium">
                      {tDashboard('keyspace.table.db')}
                    </th>
                    <th className="py-2 font-medium">
                      {tDashboard('keyspace.table.keys')}
                    </th>
                    <th className="py-2 font-medium">
                      {tDashboard('keyspace.table.expires')}
                    </th>
                    <th className="py-2 font-medium">
                      {tDashboard('keyspace.table.avgTtl')}
                    </th>
                  </tr>
                </thead>
                <tbody>{overview.keyspace.map(renderKeyspaceRow)}</tbody>
              </table>
            </div>
          ) : (
            <Empty className="min-h-[160px] border border-dashed border-border/60 bg-muted/40">
              <EmptyHeader>
                <EmptyTitle>{tDashboard('keyspace.emptyTitle')}</EmptyTitle>
                <EmptyDescription>
                  {tDashboard('keyspace.emptyDescription')}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
