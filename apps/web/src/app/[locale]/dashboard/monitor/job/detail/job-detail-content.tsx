'use client';

import { InlineLoading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowLeft,
  Loader2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useLocale, useTranslations } from 'next-intl';

import { clearJobLogs, getJobDetail, runJob } from '../../api';
import { BASE_QUERY_KEY, STATUS_BADGE_VARIANT } from '../../constants';
import type { Job, JobLog } from '../../type';
import { resolveStatusLabel, stringifyInvokeParams } from '../../utils';
import {
  describeCron,
  formatDateTime,
  getNextExecutionTimes,
} from '../../utils/cron';
import { JobLogsSection } from './job-logs-section';
import {
  JobStatusMeta,
  JobSummaryPanel,
  ToneStyles,
} from './job-summary-panel';
import { LogStepsPanel } from './log-steps-panel';
import { RealtimeLogViewer } from './realtime-log-viewer';

export type Tone = 'emerald' | 'amber' | 'sky' | 'rose' | 'slate';

const DEFAULT_LOG_PAGE_SIZE = 10;

const TONE_STYLES: Record<
  Tone,
  {
    bg: string;
    text: string;
    border: string;
  }
> = {
  emerald: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/30',
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
    border: 'border-amber-500/30',
  },
  sky: {
    bg: 'bg-sky-500/10',
    text: 'text-sky-600',
    border: 'border-sky-500/30',
  },
  rose: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-600',
    border: 'border-rose-500/30',
  },
  slate: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-600',
    border: 'border-slate-500/30',
  },
};

const JOB_STATUS_META: Record<string, JobStatusMeta> = {
  '0': {
    label: 'Running',
    helperText: 'Job will execute automatically on its cron schedule. You can pause anytime.',
    icon: PlayCircle,
    tone: 'emerald',
  },
  '1': {
    label: 'Paused',
    helperText: 'Job is paused. Resume to continue its cron schedule.',
    icon: PauseCircle,
    tone: 'amber',
  },
};

const DEFAULT_JOB_STATUS_META: JobStatusMeta = {
  label: 'Unknown status',
  helperText: 'Unable to load job status. Please refresh.',
  icon: Loader2,
  tone: 'slate',
};

interface JobDetailContentProps {
  id: number;
}

<<<<<<<< HEAD:apps/web/src/app/[locale]/dashboard/monitor/job/detail/job-detail-content.tsx
export function JobDetailContent({ jobId }: JobDetailContentProps) {
  const locale = useLocale();
  const t = useTranslations('JobManagement');
========
export function JobDetailContent({ id }: JobDetailContentProps) {
>>>>>>>> main:apps/web/src/app/dashboard/monitor/job/detail/components/job-detail-content.tsx
  const [logPagination, setLogPagination] = useState({
    pageNum: 1,
    pageSize: DEFAULT_LOG_PAGE_SIZE,
  });
  const [activeLogId, setActiveLogId] = useState<number | null>(null);
  const [activeLogName, setActiveLogName] = useState('');
  const { hasPermission } = usePermissions();
  const canRunJob = hasPermission('monitor:job:run');
  const canClearLogs = hasPermission('monitor:job:remove');

  const detailQuery = useQuery({
    queryKey: [
      ...BASE_QUERY_KEY,
      'detail',
      id,
      logPagination.pageNum,
      logPagination.pageSize,
    ],
    queryFn: () =>
      getJobDetail(id, {
        logPageNum: logPagination.pageNum,
        logPageSize: logPagination.pageSize,
      }),
    staleTime: 30 * 1000,
  });

  const detail = detailQuery.data;
  const job = detail?.job;
  const logs = detail?.logs;
  const isLoading = detailQuery.isLoading && !detail;
  const hasError = detailQuery.isError && !detail;
  const [logDetail, setLogDetail] = useState<JobLog | null>(null);
  const [logDetailOpen, setLogDetailOpen] = useState(false);

  const runJobMutation = useMutation({
    mutationFn: () => runJob(id),
    onSuccess: (data) => {
      toast.success(t('toast.runSuccess'));
      if (data?.jobLogId) {
        setActiveLogId(data.jobLogId);
        setActiveLogName(detail?.job?.jobName ?? t('detail.live.fallbackName'));
      }
      detailQuery.refetch();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : t('toast.runError');
      toast.error(message);
    },
  });

  const clearLogsMutation = useMutation({
    mutationFn: () => clearJobLogs(id),
    onSuccess: () => {
      toast.success(t('detail.logs.clearSuccess'));
      void detailQuery.refetch();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : t('detail.logs.clearError');
      toast.error(message);
    },
  });

  const formattedParams = useMemo(() => {
    return stringifyInvokeParams(detail?.invokeParamsText ?? job?.invokeParams);
  }, [detail?.invokeParamsText, job?.invokeParams]);

  const paramDisplay = useMemo(() => {
    const paramText = formattedParams ?? '';
    try {
      return paramText ? JSON.stringify(JSON.parse(paramText), null, 2) : '';
    } catch {
      return paramText;
    }
  }, [formattedParams]);

  const cronDescription = useMemo(() => {
    if (!job?.cronExpression) {
      return '—';
    }
    return describeCron(job.cronExpression);
  }, [job?.cronExpression]);

  const upcomingExecutions = useMemo(() => {
    if (!job?.cronExpression) {
      return [] as string[];
    }
    return getNextExecutionTimes(job.cronExpression, 3).map((time) =>
      formatDateTime(time),
    );
  }, [job?.cronExpression]);

  const nextExecution = useMemo(() => {
    return (
      upcomingExecutions[0] ??
      (job?.status === '1'
        ? t('detail.summary.nextExecution.paused')
        : t('detail.summary.nextExecution.pending'))
    );
  }, [job?.status, upcomingExecutions, t]);

  useEffect(() => {
    const runningLog = logs?.list.find((item) => item.status === '2');
    if (runningLog) {
      setActiveLogId(runningLog.jobLogId);
      setActiveLogName(
        runningLog.jobName || job?.jobName || t('detail.live.fallbackName'),
      );
      return;
    }

    if (detail?.job?.currentLogId) {
      setActiveLogId(detail.job.currentLogId);
      setActiveLogName(detail.job.jobName);
    }
  }, [
    detail?.job?.currentLogId,
    detail?.job?.jobName,
    detail?.job?.isRunning,
    job?.jobName,
    logs?.list,
    runJobMutation.isPending,
  ]);

  const handleLogPageChange = (page: number) => {
    setLogPagination((prev) => ({ ...prev, pageNum: page }));
  };

  const handleLogPageSizeChange = (size: number) => {
    setLogPagination({ pageNum: 1, pageSize: size });
  };

  const handleTriggerJob = () => {
    if (!job || runJobMutation.isPending) {
      return;
    }

    if (job.isRunning && job.concurrent === '1') {
      toast.info(t('toast.concurrentLocked'));
      return;
    }

    runJobMutation.mutate();
  };

  const toneStyles = getToneStyles(getJobStatusMeta(job?.status ?? '', t).tone);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link
            href={`/${locale}/dashboard/monitor/job`}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="size-4" />
            {t('detail.back')}
          </Link>
        </Button>
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
          <span className="truncate">
            {job?.jobName ? job.jobName : t('detail.titleFallback')}
          </span>
          {job ? (
            <>
              <Badge variant={STATUS_BADGE_VARIANT[job.status] ?? 'outline'}>
                {resolveStatusLabel(t, job.status)}
              </Badge>
              <span className="text-xs font-medium text-muted-foreground">
                #{job.id} · {job.jobGroup || 'DEFAULT'}
              </span>
            </>
          ) : null}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {job && canRunJob ? (
            <Button
              variant="default"
              size="sm"
              onClick={handleTriggerJob}
              disabled={
                runJobMutation.isPending ||
                (job.isRunning && job.concurrent === '1')
              }
              className="flex items-center gap-2"
            >
              {runJobMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t('detail.actions.running')}
                </>
              ) : job.isRunning && job.concurrent === '1' ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t('detail.actions.executing')}
                </>
              ) : (
                <>
                  <PlayCircle className="size-4" />
                  {t('detail.actions.run')}
                </>
              )}
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={() => detailQuery.refetch()}
            disabled={detailQuery.isFetching}
            className="flex items-center gap-2"
          >
            {detailQuery.isFetching ? (
              <InlineLoading label={t('detail.actions.refreshing')} />
            ) : (
              <>
                <RefreshCw className="size-4" />
                {t('detail.actions.refresh')}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-border/60 bg-card">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <InlineLoading label={t('detail.messages.loading')} />
            </div>
          ) : hasError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-10 text-center text-sm text-destructive">
              {t('detail.messages.error')}
            </div>
          ) : job ? (
            <div className="space-y-3 p-4">
              <JobSummaryPanel
                job={job}
                statusMeta={getJobStatusMeta(job.status, t)}
                tone={toneStyles}
                nextExecution={nextExecution}
                cronDescription={cronDescription}
                formattedParams={paramDisplay}
              />

              {activeLogId ? (
                <div className="space-y-2 rounded-lg border border-border/70 bg-muted/30 p-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                    <Activity className="size-4 text-sky-600" />
                    <span>
                      {t('detail.live.title', {
                        name: activeLogName || job.jobName,
                      })}
                    </span>
                    <Badge variant="outline" className="animate-pulse">
                      {t('detail.live.badge')}
                    </Badge>
                  </div>
                  <RealtimeLogViewer
                    jobLogId={activeLogId}
                    jobName={activeLogName || job.jobName}
                    onComplete={() => {
                      detailQuery.refetch();
                      setActiveLogId(null);
                    }}
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              {t('detail.messages.empty')}
            </div>
          )}
        </div>

        {job ? (
          <JobLogsSection
            job={job}
            logs={logs}
            isLoading={detailQuery.isFetching}
            upcomingExecutions={upcomingExecutions}
            cronDescription={cronDescription}
            onPageChange={handleLogPageChange}
            onPageSizeChange={handleLogPageSizeChange}
            onSelectLog={(log) => {
              setLogDetail(log);
              setLogDetailOpen(true);
            }}
            onClearLogs={() => clearLogsMutation.mutate()}
            canClearLogs={canClearLogs}
            clearing={clearLogsMutation.isPending}
            t={t}
          />
        ) : null}
      </div>

      <ResponsiveDialog
        open={logDetailOpen}
        onOpenChange={(open) => {
          setLogDetailOpen(open);
          if (!open) {
            setLogDetail(null);
          }
        }}
      >
        <ResponsiveDialog.Content className="w-[min(900px,calc(100vw-1.5rem))] sm:max-w-4xl">
          <ResponsiveDialog.Header>
            <ResponsiveDialog.Title>{t('detail.dialog.title')}</ResponsiveDialog.Title>
            <ResponsiveDialog.Description>
              {t('detail.dialog.description')}
            </ResponsiveDialog.Description>
          </ResponsiveDialog.Header>
          {logDetail ? (
            <LogStepsPanel log={logDetail} />
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {t('detail.dialog.empty')}
            </div>
          )}
        </ResponsiveDialog.Content>
      </ResponsiveDialog>
    </div>
  );
}

function getToneStyles(tone: Tone): ToneStyles {
  return TONE_STYLES[tone] ?? TONE_STYLES.slate;
}

type Translator = (key: string, values?: Record<string, string | number>) => string;

function getJobStatusMeta(status: string, t?: Translator): JobStatusMeta {
  if (t) {
    const metaKey =
      status === '0'
        ? 'detail.summary.status.running'
        : status === '1'
          ? 'detail.summary.status.paused'
          : 'detail.summary.status.unknown';
    const base = JOB_STATUS_META[status] ?? DEFAULT_JOB_STATUS_META;
    return {
      ...base,
      label: t(`${metaKey}.label`),
      helperText: t(`${metaKey}.helper`),
    };
  }
  return JOB_STATUS_META[status] ?? DEFAULT_JOB_STATUS_META;
}
