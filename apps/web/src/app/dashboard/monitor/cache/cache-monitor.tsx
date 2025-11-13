'use client';

import { InlineLoading } from '@/components/loading';
import { Button } from '@/components/ui/button';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Database,
  Gauge,
  HardDrive,
  Layers,
  RefreshCcw,
  Server,
  Users,
} from 'lucide-react';

import { getCacheOverview } from './api';
import type { CacheKeyspaceInfo, CacheOverview } from './type';

const DEFAULT_OVERVIEW: CacheOverview = {
  server: {},
  clients: {},
  memory: {},
  stats: {},
  persistence: {},
  keyspace: [],
};

function formatBytes(value?: number | null, fractionDigits = 1) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return '-';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const power = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  );
  const adjusted = value / Math.pow(1024, power);
  return `${adjusted.toFixed(fractionDigits)} ${units[power]}`;
}

function formatPercent(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '0%';
  }
  return `${value.toFixed(1)}%`;
}

function formatNumber(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '0';
  }
  return new Intl.NumberFormat().format(value);
}

function safeMemoryGauge(used?: number, max?: number) {
  if (typeof used !== 'number' || used < 0) {
    return 0;
  }
  if (typeof max !== 'number' || max <= 0) {
    return Math.min(100, (used / (512 * 1024 * 1024)) * 100);
  }
  return Math.min(100, (used / max) * 100);
}

function summarizeKeys(keyspace: CacheKeyspaceInfo[]) {
  if (!Array.isArray(keyspace) || keyspace.length === 0) {
    return 0;
  }
  return keyspace.reduce((total, item) => total + (item?.keys ?? 0), 0);
}

function renderKeyspaceRow(space: CacheKeyspaceInfo) {
  const avgTTL =
    typeof space.avgTtl === 'number' && space.avgTtl > 0
      ? `${Math.round(space.avgTtl / 1000)}s`
      : '未知';

  return (
    <TableRow key={space.db} className="text-sm">
      <TableCell className="font-medium text-foreground">
        {space.db.toUpperCase()}
      </TableCell>
      <TableCell>{formatNumber(space.keys)}</TableCell>
      <TableCell>{formatNumber(space.expires)}</TableCell>
      <TableCell>{avgTTL}</TableCell>
    </TableRow>
  );
}

export function CacheMonitor() {
  const query = useQuery({
    queryKey: ['monitor', 'cache', 'overview'],
    queryFn: getCacheOverview,
    refetchInterval: 30_000,
  });

  if (query.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <InlineLoading label="加载缓存监控..." />
      </div>
    );
  }

  if (query.isError) {
    return (
      <Card className="border-destructive/40 bg-destructive/10 text-destructive">
        <CardHeader>
          <CardTitle className="text-lg">无法加载缓存监控数据</CardTitle>
          <CardDescription className="text-destructive/80">
            请稍后再试。
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const overview = query.data ?? DEFAULT_OVERVIEW;
  const totalKeys = summarizeKeys(overview.keyspace ?? []);
  const memoryUsagePercent = safeMemoryGauge(
    overview.memory.usedMemory,
    overview.memory.maxMemory,
  );
  const memoryUsageLabel =
    overview.memory.maxMemory && overview.memory.maxMemory > 0
      ? `${formatBytes(overview.memory.usedMemory)} / ${formatBytes(overview.memory.maxMemory)}`
      : (overview.memory.usedMemoryHuman ??
        formatBytes(overview.memory.usedMemory));
  const hitRate = formatPercent(overview.stats.hitRate);
  const opsPerSec = overview.stats.instantaneousOps ?? 0;
  const lastUpdated =
    query.dataUpdatedAt && Number.isFinite(query.dataUpdatedAt)
      ? new Date(query.dataUpdatedAt).toLocaleString()
      : '刚刚';

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

  return (
    <div className="mx-auto flex w-full flex-col gap-6 sm:gap-6">
      <Card className="border-border/60 bg-card/90  dark:border-border/40">
        <CardContent className="flex flex-col gap-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Server className="size-4" />
              Redis 服务监控
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                缓存概览
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                快速洞察 Redis 的运行状态、内存占用与命中效率。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {metaItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 rounded-full border border-border/70 px-4 py-1.5 text-sm font-medium text-foreground/90 dark:border-border/50"
                  >
                    <Icon className="size-3.5 text-muted-foreground" />
                    <span>{item.label}</span>
                    <span className="text-foreground">{item.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 text-xs text-muted-foreground lg:items-end">
            <span>最近更新时间：{lastUpdated}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
              className="w-full sm:w-auto"
            >
              {query.isFetching ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  刷新中
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 size-4" />
                  刷新
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/70  dark:border-border/40">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              内存与命中情况
            </CardTitle>
            <CardDescription>掌握内存占用与访问效率</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-muted-foreground">
            <div className="space-y-2 rounded-3xl bg-muted/20 p-5 dark:bg-muted/20/60">
              <div className="flex items-center justify-between text-foreground">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <HardDrive className="size-4 text-muted-foreground" />
                  内存占用
                </span>
                <span className="text-base font-semibold text-foreground">
                  {memoryUsageLabel}
                </span>
              </div>
              <Progress value={memoryUsagePercent} aria-label="内存占用比例" />
              <div className="grid grid-cols-2 gap-y-2 text-xs uppercase tracking-wide text-muted-foreground">
                <span>峰值占用</span>
                <span className="text-right text-foreground">
                  {overview.memory.usedMemoryPeakHuman ??
                    formatBytes(overview.memory.usedMemoryPeak)}
                </span>
                <span>最大内存</span>
                <span className="text-right text-foreground">
                  {overview.memory.maxMemoryHuman ??
                    (overview.memory.maxMemory
                      ? formatBytes(overview.memory.maxMemory)
                      : '未限制')}
                </span>
                <span>碎片率</span>
                <span className="text-right text-foreground">
                  {formatPercent(overview.memory.fragmentationRatio)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div className="rounded-3xl border border-border/50 bg-background/80 p-4  dark:border-border/40">
                <div className="flex items-center gap-2 text-foreground">
                  <Users className="size-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">客户端连接</span>
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
              <div className="rounded-3xl border border-border/50 bg-background/80 p-4  dark:border-border/40">
                <div className="flex items-center gap-2 text-foreground">
                  <Layers className="size-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">访问统计</span>
                </div>
                <div className="mt-3 space-y-2 text-xs uppercase tracking-wide">
                  <div className="flex items-center justify-between">
                    <span>命中次数</span>
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

        <Card className="border-border/70  dark:border-border/40">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-semibold">服务器状态</CardTitle>
            <CardDescription>查看核心运行参数与持久化信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="grid grid-cols-2 gap-3 rounded-3xl border border-border/50 bg-background/80 p-4  dark:border-border/40">
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
            <div className="rounded-3xl border border-border/50 bg-background/80 p-4  dark:border-border/40">
              <div className="flex items-center gap-2 text-foreground">
                <Database className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold">持久化</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs uppercase tracking-wide">
                <div>
                  <div className="text-muted-foreground">上次 RDB 保存</div>
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
                  <div className="text-muted-foreground">未持久化变更</div>
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

      <Card className="border-border/70  dark:border-border/40">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers className="size-4 text-muted-foreground" />
            Keyspace 分布
          </CardTitle>
          <CardDescription>各个逻辑库的键数量与过期情况</CardDescription>
        </CardHeader>
        <CardContent>
          {overview.keyspace && overview.keyspace.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>数据库</TableHead>
                    <TableHead>键数量</TableHead>
                    <TableHead>过期键</TableHead>
                    <TableHead>平均 TTL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.keyspace.map(renderKeyspaceRow)}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Empty className="min-h-[200px] border border-dashed border-border/60 bg-muted/40">
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
