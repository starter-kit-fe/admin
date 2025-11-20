'use client';

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
import { cn } from '@/lib/utils';

import type { CacheKeyspaceInfo } from '../api/types';
import { useCacheOverviewStream } from '../hooks/use-cache-overview-stream';
import {
  formatBytes,
  formatNumber,
  formatPercent,
  safeMemoryGauge,
  summarizeKeys,
} from '../utils';

function formatTimestamp(value?: number | null) {
  if (!value || Number.isNaN(value)) {
    return '等待实时流';
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
  if (percent >= 85) {
    return {
      backdrop: 'bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent',
      fill: 'from-rose-500/40 via-rose-500/20 to-transparent',
      badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-200',
    };
  }
  if (percent >= 65) {
    return {
      backdrop: 'bg-gradient-to-br from-amber-400/15 via-amber-400/5 to-transparent',
      fill: 'from-amber-400/35 via-amber-400/15 to-transparent',
      badge: 'bg-amber-400/20 text-amber-700 dark:text-amber-100',
    };
  }
  return {
    backdrop: 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent',
    fill: 'from-emerald-500/30 via-emerald-500/15 to-transparent',
    badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
  };
}

const safeNumber = (value?: number | null) =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

export function CacheDashboard() {
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
      : overview.memory.maxMemoryHuman ?? '未配置上限';
  const memoryPeakLabel =
    overview.memory.usedMemoryPeakHuman ??
    formatBytes(peakMemory, {
      decimals: 1,
    });

  const hitRate = safeNumber(overview.stats.hitRate);
  const opsPerSec = safeNumber(overview.stats.instantaneousOps);

  const metaItems = [
    {
      icon: Database,
      label: '键总数',
      value: totalKeys,
      formatValue: (val: number) => formatNumber(Math.max(0, Math.round(val))),
    },
    {
      icon: Gauge,
      label: '命中率',
      value: hitRate,
      formatValue: (val: number) =>
        formatPercent(Math.max(0, Math.min(100, val))),
    },
    {
      icon: Activity,
      label: '每秒命令',
      value: opsPerSec,
      formatValue: (val: number) =>
        formatNumber(Math.max(0, Math.round(val))),
    },
  ];

  const hitCount = safeNumber(overview.stats.keyspaceHits);
  const missCount = safeNumber(overview.stats.keyspaceMisses);
  const expiredKeys = safeNumber(overview.stats.expiredKeys);
  const evictedKeys = safeNumber(overview.stats.evictedKeys);
  const connectedClients = safeNumber(overview.clients.connected);
  const blockedClients = safeNumber(overview.clients.blocked);

  const connectionBadgeClass = stream.isConnected
    ? 'bg-primary/15 text-primary'
    : 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100';
  const connectionLabel = stream.isConnected ? '实时更新' : '等待连接';
  const isConnecting = stream.isLoading || (!stream.isConnected && !stream.error);

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <Card className="shadow-none border-none">
        <CardHeader className="space-y-4 lg:flex lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold">
              缓存监控
            </CardTitle>
            <CardDescription>
              使用 SSE 实时捕获 Redis 运行状态与键分布，无需轮询。
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
                  stream.isConnected ? 'bg-primary animate-pulse' : 'bg-amber-500',
                )}
              />
              {connectionLabel}
            </div>
            <div>概览更新时间：{formatTimestamp(stream.lastUpdated)}</div>
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
                  连接中
                </>
              ) : (
                <>
                  <RefreshCcw className="size-4" />
                  重新连接
                </>
              )}
            </PermissionButton>
          </div>
        </CardHeader>
        {stream.error && !stream.isConnected ? (
          <CardContent>
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="size-4" />
              {stream.error || '无法加载缓存概览，请稍后再试。'}
            </div>
          </CardContent>
        ) : null}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-none border-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-semibold">运行概览</CardTitle>
            <CardDescription>内存、命中率与客户端连接情况</CardDescription>
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
              <div
                aria-hidden
                className={cn(
                  'pointer-events-none absolute inset-y-1 left-1 rounded-xl bg-gradient-to-r transition-[width] duration-700 ease-out',
                  memoryTone.fill,
                )}
                style={{ width: memoryFillWidth }}
              />
              <div className="relative space-y-3">
                <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                  <span className="flex items-center gap-2">
                    <HardDrive className="size-4 text-muted-foreground" />
                    内存占用
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
                        formatPercent(Math.max(0, Math.min(100, val)))}
                      snap={0.1}
                    />
                  </span>
                </div>
                <div className="flex flex-col gap-4 text-xs uppercase tracking-wide text-muted-foreground sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-2">
                    <div>使用中</div>
                    <NumberTicker
                      value={usedMemory}
                      formatValue={(val) => formatBytes(val, { decimals: 1 })}
                      className="text-lg font-semibold text-foreground"
                    />
                    <div className="text-muted-foreground">峰值 {memoryPeakLabel}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground">限制</div>
                    <div className="text-sm font-semibold text-foreground">
                      {memoryLimitLabel}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      碎片率{' '}
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
                  <span className="text-sm font-semibold">客户端</span>
                </div>
                <div className="mt-3 space-y-2 text-xs uppercase tracking-wide">
                  <div className="flex items-center justify-between">
                    <span>已连接</span>
                    <NumberTicker
                      value={connectedClients}
                      formatValue={(val) =>
                        formatNumber(Math.max(0, Math.round(val)))}
                      className="text-foreground"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>被阻塞</span>
                    <NumberTicker
                      value={blockedClients}
                      formatValue={(val) =>
                        formatNumber(Math.max(0, Math.round(val)))}
                      className="text-foreground"
                    />
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
                    <NumberTicker
                      value={hitCount}
                      formatValue={(val) =>
                        formatNumber(Math.max(0, Math.round(val)))}
                      className="text-foreground"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>未命中</span>
                    <NumberTicker
                      value={missCount}
                      formatValue={(val) =>
                        formatNumber(Math.max(0, Math.round(val)))}
                      className="text-foreground"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>过期键</span>
                    <NumberTicker
                      value={expiredKeys}
                      formatValue={(val) =>
                        formatNumber(Math.max(0, Math.round(val)))}
                      className="text-foreground"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>驱逐键</span>
                    <NumberTicker
                      value={evictedKeys}
                      formatValue={(val) =>
                        formatNumber(Math.max(0, Math.round(val)))}
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
            <CardTitle className="text-lg font-semibold">服务器状态</CardTitle>
            <CardDescription>核心运行参数与持久化信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/50 p-4">
              {[
                { label: '运行模式', value: overview.server.mode || '未知' },
                { label: '角色', value: overview.server.role || 'master' },
                { label: '版本', value: overview.server.version || '-' },
                { label: '运行时长', value: overview.server.uptime || '-' },
              ].map((item) => (
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
                    {formatNumber(
                      overview.persistence.rdbChangesSinceLastSave || 0,
                    )}
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

      <Card className="shadow-none border-none px-2 py-3">
        <CardHeader className="">
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
