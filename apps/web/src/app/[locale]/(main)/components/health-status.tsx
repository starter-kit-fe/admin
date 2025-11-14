'use client';

import { gethealthz } from '@/api';
import { Badge } from '@/components/ui/badge';
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
import { Spinner } from '@/components/ui/spinner';
import {useQuery} from '@tanstack/react-query';
import {RefreshCw} from 'lucide-react';
import {useMemo} from 'react';
import {useTranslations} from 'next-intl';

const STATUS_COLORS: Record<string, string> = {
  ok: 'bg-emerald-500',
  healthy: 'bg-emerald-500',
  disabled: 'bg-amber-500',
  offline: 'bg-destructive',
  error: 'bg-destructive',
};

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
  const t = useTranslations('HealthStatus');
  const {data, isLoading, isError, error, refetch, isFetching} = useQuery({
    queryKey: ['system', 'health'],
    queryFn: gethealthz,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'database':
        return t('metrics.database');
      case 'cache':
        return t('metrics.cache');
      case 'uptime':
        return t('metrics.uptime');
      default:
        return metric;
    }
  };

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
          <CardTitle className="text-lg">{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
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
              {t('actions.refreshing')}
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('actions.refresh')}
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/60 px-4 py-6 text-muted-foreground">
            <Spinner className="h-5 w-5" />
            {t('messages.loading')}
          </div>
        ) : isError ? (
          <div className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-4 text-sm text-destructive">
            <p>{t('messages.error')}</p>
            {error instanceof Error ? (
              <p className="text-xs text-destructive/80">
                {t('messages.errorReason', {message: error.message})}
              </p>
            ) : null}
          </div>
        ) : !data ? (
          <Empty className="min-h-[160px] border border-border/60 bg-muted/30">
            <EmptyHeader>
              <EmptyTitle>{t('messages.emptyTitle')}</EmptyTitle>
              <EmptyDescription>{t('messages.emptyDescription')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
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
                      {getMetricLabel(key)}
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={resolveBadgeColor(value)}
                  >
                    {value ?? t('messages.unknown')}
                  </Badge>
                </div>
              ))}
            <div className="sm:col-span-2 rounded-lg border border-border/60 px-4 py-4 text-sm text-muted-foreground">
              <span className="font-medium text-foreground/80">
                {getMetricLabel('uptime')}：
              </span>{' '}
              {uptime ?? t('messages.uptimeMissing')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
