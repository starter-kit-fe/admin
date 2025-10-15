'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import http from '@/lib/request';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useMemo } from 'react';

type HealthRecord = {
  database?: string;
  cache?: string;
  uptime?: string;
};

const STATUS_LABELS: Record<string, string> = {
  database: '数据库',
  cache: '缓存',
  uptime: '最近探活',
};

const STATUS_COLORS: Record<string, string> = {
  ok: 'bg-emerald-500',
  healthy: 'bg-emerald-500',
  disabled: 'bg-amber-500',
  offline: 'bg-destructive',
  error: 'bg-destructive',
};

async function fetchHealthStatus() {
  return http.get<HealthRecord | null>('/healthz');
}

function resolveBadgeColor(raw: string | undefined) {
  if (!raw) {
    return 'bg-border text-muted-foreground';
  }
  const lower = raw.toLowerCase();
  if (lower === 'ok') {
    return 'bg-emerald-500/15 text-emerald-500';
  }
  if (lower === 'disabled') {
    return 'bg-amber-500/15 text-amber-500';
  }
  return 'bg-destructive/10 text-destructive';
}

function resolveSignalColor(raw: string | undefined) {
  const lower = raw?.toLowerCase() ?? '';
  if (STATUS_COLORS[lower]) {
    return STATUS_COLORS[lower];
  }
  return 'bg-destructive';
}

export default function HealthStatusPanel() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['system', 'health'],
    queryFn: fetchHealthStatus,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const uptime = useMemo(() => {
    if (!data?.uptime) {
      return null;
    }
    const parsed = new Date(data.uptime);
    if (Number.isNaN(parsed.getTime())) {
      return data.uptime;
    }
    return parsed.toLocaleString();
  }, [data?.uptime]);

  return (
    <Card className="border-border/70 bg-background/80 backdrop-blur">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">服务健康状态</CardTitle>
          <CardDescription>
            实时探测 API、数据库、缓存等依赖的运行情况。
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-full sm:w-auto"
        >
          {isFetching ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              刷新中
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              重新检测
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/60 px-4 py-6 text-muted-foreground">
            <Spinner className="h-5 w-5" />
            正在获取最新状态...
          </div>
        ) : isError ? (
          <div className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-4 text-sm text-destructive">
            <p>无法获取健康状态。</p>
            {error instanceof Error ? (
              <p className="text-xs text-destructive/80">
                原因：{error.message}
              </p>
            ) : null}
          </div>
        ) : !data ? (
          <div className="rounded-lg border border-border/60 px-4 py-4 text-sm text-muted-foreground">
            暂无健康数据返回。
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(data)
              .filter(([key]) => key !== 'uptime')
              .map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${resolveSignalColor(
                        value,
                      )}`}
                    />
                    <span className="text-sm font-medium text-foreground/90">
                      {STATUS_LABELS[key] ?? key}
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={resolveBadgeColor(value)}
                  >
                    {value ?? '未知'}
                  </Badge>
                </div>
              ))}
            <div className="sm:col-span-2 rounded-lg border border-border/60 px-4 py-4 text-sm text-muted-foreground">
              <span className="font-medium text-foreground/80">
                {STATUS_LABELS.uptime}：
              </span>{' '}
              {uptime ?? '未提供'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
