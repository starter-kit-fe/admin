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

function formatTimestamp(value?: number) {
  if (!value || Number.isNaN(value)) {
    return '刚刚';
  }
  return new Date(value).toLocaleString();
}

function renderKeyspaceRow(space: CacheKeyspaceInfo) {
  const avgTTL =
    typeof space.avgTtl === 'number' && space.avgTtl > 0
      ? `${Math.round(space.avgTtl / 1000)}s`
      : '未知';

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
      label: '键总数',
      value: formatNumber(totalKeys),
    },
    {
      icon: Gauge,
      label: '命中率',
      value: hitRate,
    },
    {
      icon: Activity,
      label: '每秒命令',
      value: formatNumber(opsPerSec),
    },
  ];

  const serverMeta = [
    { label: '运行模式', value: overview.server.mode || '未知' },
    { label: '角色', value: overview.server.role || 'master' },
    { label: '版本', value: overview.server.version || '-' },
    { label: '运行时长', value: overview.server.uptime || '-' },
  ];

  const refreshOverview = () => {
    void overviewQuery.refetch();
  };

  const isRefreshing = overviewQuery.isFetching;

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <Card className="border-border/70 bg-card/90 dark:border-border/40">
        <CardHeader className="space-y-4 lg:flex lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold">
              缓存监控
            </CardTitle>
            <CardDescription>
              在统一视图内同时掌握 Redis 运行状态与键分布。
            </CardDescription>
            <div className="flex flex-wrap gap-2">
              {metaItems.map((item) => (
                <MetaPill
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 text-xs text-muted-foreground lg:items-end">
            <div>概览更新时间：{formatTimestamp(overviewQuery.dataUpdatedAt)}</div>
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
                  刷新中
                </>
              ) : (
                <>
                  <RefreshCcw className="size-4" />
                  刷新数据
                </>
              )}
            </PermissionButton>
          </div>
        </CardHeader>
        {overviewQuery.isError ? (
          <CardContent>
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="size-4" />
              无法加载缓存概览，请稍后再试。
            </div>
          </CardContent>
        ) : null}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/70 dark:border-border/40">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-semibold">运行概览</CardTitle>
            <CardDescription>内存、命中率与客户端连接情况</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 rounded-xl border border-border/50 p-4">
              <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                <span className="flex items-center gap-2">
                  <HardDrive className="size-4 text-muted-foreground" />
                  内存占用
                </span>
                <span>{memoryUsageLabel}</span>
              </div>
              <Progress value={memoryUsagePercent} aria-label="内存占用比例" />
              <div className="grid grid-cols-2 gap-y-2 text-xs uppercase tracking-wide text-muted-foreground">
                <span>峰值占用</span>
                <span className="text-right text-foreground">
                  {overview.memory.usedMemoryPeakHuman ??
                    formatBytes(overview.memory.usedMemoryPeak, {
                      decimals: 1,
                    })}
                </span>
                <span>碎片率</span>
                <span className="text-right text-foreground">
                  {formatPercent(overview.memory.fragmentationRatio)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div className="rounded-xl border border-border/50 p-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Users className="size-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">客户端</span>
                </div>
                <div className="mt-3 space-y-2 text-xs uppercase tracking-wide">
                  <div className="flex items-center justify-between">
                    <span>已连接</span>
                    <span className="text-foreground">
                      {formatNumber(overview.clients.connected)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>被阻塞</span>
                    <span className="text-foreground">
                      {formatNumber(overview.clients.blocked)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border/50 p-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Layers className="size-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">访问统计</span>
                </div>
                <div className="mt-3 space-y-2 text-xs uppercase tracking-wide">
                  <div className="flex items-center justify-between">
                    <span>命中</span>
                    <span className="text-foreground">
                      {formatNumber(overview.stats.keyspaceHits)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>未命中</span>
                    <span className="text-foreground">
                      {formatNumber(overview.stats.keyspaceMisses)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>过期键</span>
                    <span className="text-foreground">
                      {formatNumber(overview.stats.expiredKeys)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>驱逐键</span>
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
            <CardTitle className="text-lg font-semibold">服务器状态</CardTitle>
            <CardDescription>核心运行参数与持久化信息</CardDescription>
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
                <span className="text-sm font-semibold">持久化</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs uppercase tracking-wide">
                <div>
                  <div className="text-muted-foreground">上次 RDB</div>
                  <div className="text-sm font-medium text-foreground">
                    {overview.persistence.rdbLastSaveTime || '未执行'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">状态</div>
                  <div className="text-sm font-medium text-foreground">
                    {overview.persistence.rdbLastStatus || '未知'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">未持久化</div>
                  <div className="text-sm font-medium text-foreground">
                    {formatNumber(overview.persistence.rdbChangesSinceLastSave)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">AOF</div>
                  <div
                    className={cn(
                      'text-sm font-medium',
                      overview.persistence.aofEnabled
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-muted-foreground',
                    )}
                  >
                    {overview.persistence.aofEnabled ? '已开启' : '未开启'}
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
            Keyspace 分布
          </CardTitle>
          <CardDescription>各逻辑库的键数量与过期情况</CardDescription>
        </CardHeader>
        <CardContent>
          {overview.keyspace && overview.keyspace.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 font-medium">数据库</th>
                    <th className="py-2 font-medium">键数量</th>
                    <th className="py-2 font-medium">过期键</th>
                    <th className="py-2 font-medium">平均 TTL</th>
                  </tr>
                </thead>
                <tbody>{overview.keyspace.map(renderKeyspaceRow)}</tbody>
              </table>
            </div>
          ) : (
            <Empty className="min-h-[160px] border border-dashed border-border/60 bg-muted/40">
              <EmptyHeader>
                <EmptyTitle>暂无 Keyspace 数据</EmptyTitle>
                <EmptyDescription>
                  等待缓存上报指标后再来查看分布情况。
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
