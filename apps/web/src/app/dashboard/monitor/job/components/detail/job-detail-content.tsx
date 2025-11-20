'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  Clock3,
  Loader2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { PaginationToolbar } from '@/components/pagination/pagination-toolbar';
import { InlineLoading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/use-permissions';

import { getJobDetail, runJob } from '../../api';
import { BASE_QUERY_KEY, STATUS_BADGE_VARIANT } from '../../constants';
import type { Job } from '../../type';
import {
  resolveConcurrentLabel,
  resolveMisfireLabel,
  resolveStatusLabel,
  stringifyInvokeParams,
} from '../../utils';
import {
  describeCron,
  formatDateTime,
  getNextExecutionTimes,
} from '../../utils/cron';
import { JobLogsViewer } from './job-logs-viewer';
import { RealtimeLogViewer } from './realtime-log-viewer';

type Tone = 'emerald' | 'amber' | 'sky' | 'rose' | 'slate';

const LOG_PAGE_SIZES = [5, 10, 20];
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
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600',
    border: 'border-emerald-500/30',
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

interface JobStatusMeta {
  label: string;
  helperText: string;
  icon: LucideIcon;
  tone: Tone;
}

const JOB_STATUS_META: Record<string, JobStatusMeta> = {
  '0': {
    label: '运行中',
    helperText: '任务会按 Cron 计划自动执行，您可以随时暂停。',
    icon: PlayCircle,
    tone: 'emerald',
  },
  '1': {
    label: '已暂停',
    helperText: '任务已暂停，恢复后会继续沿用当前 Cron 计划。',
    icon: PauseCircle,
    tone: 'amber',
  },
};

const DEFAULT_JOB_STATUS_META: JobStatusMeta = {
  label: '未知状态',
  helperText: '无法获取任务状态，请刷新后重试。',
  icon: Loader2,
  tone: 'slate',
};

interface JobDetailContentProps {
  jobId: number;
}

export function JobDetailContent({ jobId }: JobDetailContentProps) {
  const [logPagination, setLogPagination] = useState({
    pageNum: 1,
    pageSize: DEFAULT_LOG_PAGE_SIZE,
  });
  const [activeLogId, setActiveLogId] = useState<number | null>(null);
  const [activeLogName, setActiveLogName] = useState('');
  const { hasPermission } = usePermissions();
  const canRunJob = hasPermission('monitor:job:run');

  const detailQuery = useQuery({
    queryKey: [
      ...BASE_QUERY_KEY,
      'detail',
      jobId,
      logPagination.pageNum,
      logPagination.pageSize,
    ],
    queryFn: () =>
      getJobDetail(jobId, {
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

  const runJobMutation = useMutation({
    mutationFn: () => runJob(jobId),
    onSuccess: (data) => {
      toast.success('任务已提交执行');
      if (data?.jobLogId) {
        setActiveLogId(data.jobLogId);
        setActiveLogName(detail?.job?.jobName ?? '任务执行');
      }
      detailQuery.refetch();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : '触发任务失败，请稍后重试';
      toast.error(message);
    },
  });

  const formattedParams = useMemo(() => {
    return stringifyInvokeParams(detail?.invokeParamsText ?? job?.invokeParams);
  }, [detail?.invokeParamsText, job?.invokeParams]);

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
      formatDateTime(time)
    );
  }, [job?.cronExpression]);

  const nextExecution = useMemo(() => {
    return upcomingExecutions[0] ?? (job?.status === '1' ? '已暂停' : '等待调度');
  }, [job?.status, upcomingExecutions]);

  useEffect(() => {
    const runningLog = logs?.items.find((item) => item.status === '2');
    if (runningLog) {
      setActiveLogId(runningLog.jobLogId);
      setActiveLogName(runningLog.jobName || job?.jobName || '任务执行');
      return;
    }

    if (detail?.job?.currentLogId) {
      setActiveLogId(detail.job.currentLogId);
      setActiveLogName(detail.job.jobName);
    }
  }, [detail?.job?.currentLogId, detail?.job?.jobName, detail?.job?.isRunning, job?.jobName, logs?.items, runJobMutation.isPending]);

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
      toast.info('任务正在执行且不允许并发，请稍后再试');
      return;
    }

    runJobMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/monitor/job" className="flex items-center gap-2">
            <ArrowLeft className="size-4" />
            返回列表
          </Link>
        </Button>
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
          <span className="truncate">
            {job?.jobName ? job.jobName : '任务详情'}
          </span>
          {job ? (
            <>
              <Badge variant={STATUS_BADGE_VARIANT[job.status] ?? 'outline'}>
                {resolveStatusLabel(job.status)}
              </Badge>
              <span className="text-xs font-medium text-muted-foreground">
                #{job.jobId} · {job.jobGroup || 'DEFAULT'}
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
              disabled={runJobMutation.isPending || (job.isRunning && job.concurrent === '1')}
              className="flex items-center gap-2"
            >
              {runJobMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  触发中...
                </>
              ) : job.isRunning && job.concurrent === '1' ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  执行中
                </>
              ) : (
                <>
                  <PlayCircle className="size-4" />
                  立即执行一次
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
              <InlineLoading label="刷新中" />
            ) : (
              <>
                <RefreshCw className="size-4" />
                刷新数据
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <InlineLoading label="正在加载任务详情..." />
          </div>
        ) : hasError ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-10 text-center text-sm text-destructive">
            加载失败，请稍后再试。
          </div>
        ) : job ? (
          <div className="grid gap-4 p-4 lg:grid-cols-[320px_1fr]">
            <JobSummaryPanel
              job={job}
              statusMeta={getJobStatusMeta(job.status)}
              tone={getToneStyles(getJobStatusMeta(job.status).tone)}
              nextExecution={nextExecution}
              cronDescription={cronDescription}
              upcomingExecutions={upcomingExecutions}
              formattedParams={formattedParams}
            />

            <div className="space-y-3">
              {activeLogId ? (
                <div className="space-y-2 rounded-lg border border-border/70 bg-muted/30 p-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                    <Activity className="size-4 text-sky-600" />
                    <span>实时执行 · {activeLogName || job.jobName}</span>
                    <Badge variant="outline" className="animate-pulse">
                      执行中
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

              <div className="space-y-2 rounded-lg border border-border/70 bg-background">
                <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Activity className="size-4 text-muted-foreground" />
                    <span>执行日志</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    共 {logs?.total ?? 0} 条
                  </span>
                </div>
                <div className="p-2 sm:p-3">
                  {logs && logs.items.length > 0 ? (
                    <JobLogsViewer logs={logs.items} isLoading={detailQuery.isFetching} />
                  ) : (
                    <AwaitingExecutionState
                      jobStatus={job.status}
                      cronDescription={cronDescription}
                      upcomingExecutions={upcomingExecutions}
                    />
                  )}
                </div>
                {logs ? (
                  <div className="border-t border-border/70 px-3 py-2">
                    <PaginationToolbar
                      totalItems={logs.total}
                      currentPage={logs.pageNum}
                      pageSize={logs.pageSize}
                      onPageChange={handleLogPageChange}
                      onPageSizeChange={handleLogPageSizeChange}
                      pageSizeOptions={LOG_PAGE_SIZES}
                      disabled={detailQuery.isFetching}
                      className="justify-end"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            未找到任务信息。
          </div>
        )}
      </div>
    </div>
  );
}

function JobSummaryPanel({
  job,
  statusMeta,
  tone,
  nextExecution,
  cronDescription,
  upcomingExecutions,
  formattedParams,
}: {
  job: Job;
  statusMeta: JobStatusMeta;
  tone: { bg: string; text: string; border: string };
  nextExecution: string;
  cronDescription: string;
  upcomingExecutions: string[];
  formattedParams: string | undefined;
}) {
  const StatusIcon = statusMeta.icon;

  return (
    <aside className="space-y-3 rounded-lg border border-border/70 bg-background p-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl border',
            tone.bg,
            tone.text,
            tone.border
          )}
        >
          <StatusIcon className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-lg font-semibold text-foreground">
              {job.jobName}
            </p>
            <Badge variant={STATUS_BADGE_VARIANT[job.status] ?? 'outline'}>
              {resolveStatusLabel(job.status)}
            </Badge>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {job.invokeTarget || '未配置调用目标'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {job.jobGroup || 'DEFAULT'} · ID #{job.jobId}
          </p>
          {job.isRunning ? (
            <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-700 animate-pulse">
              <Loader2 className="size-3.5 animate-spin" />
              执行中
              {job.currentLogId ? ` · 日志 #${job.currentLogId}` : ''}
            </span>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">{statusMeta.helperText}</p>
          )}
        </div>
      </div>

      <div className="grid gap-2 text-sm">
        <MetaRow label="下一次执行" value={nextExecution} hint={upcomingExecutions.slice(1)} />
        <MetaRow label="Cron 表达式" value={job.cronExpression || '未设置'} hint={cronDescription} />
        <MetaRow label="调用目标" value={job.invokeTarget || '—'} />
        <MetaRow label="调度策略" value={resolveMisfireLabel(job.misfirePolicy)} />
        <MetaRow label="并发策略" value={resolveConcurrentLabel(job.concurrent)} />
        {job.remark ? <MetaRow label="备注" value={job.remark} /> : null}
        <MetaRow label="创建" value={job.createTime || '—'} hint={job.createBy || ''} />
        <MetaRow label="更新" value={job.updateTime || '—'} hint={job.updateBy || ''} />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">调用参数</p>
        {formattedParams ? (
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted/40 px-3 py-2 text-xs font-mono text-foreground">
            {formattedParams}
          </pre>
        ) : (
          <p className="text-xs text-muted-foreground">未配置参数</p>
        )}
      </div>
    </aside>
  );
}

function AwaitingExecutionState({
  jobStatus,
  upcomingExecutions,
  cronDescription,
}: {
  jobStatus: string;
  upcomingExecutions: string[];
  cronDescription: string;
}) {
  const waitingMessage =
    jobStatus === '0'
      ? '任务已创建，将在下一次 Cron 调度时执行。'
      : '任务已暂停，恢复后才会重新调度。';

  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground">
        <Clock3 className="size-6" />
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">
        {jobStatus === '0' ? '等待下一次调度' : '当前任务已暂停'}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{waitingMessage}</p>
      {upcomingExecutions.length > 0 && (
        <div className="mt-4 space-y-1 text-xs text-muted-foreground">
          {upcomingExecutions.map((time, index) => (
            <div key={`${time}-${index}`}>
              {index === 0 ? '下一次' : `#${index + 1}`} 执行 · {time}
            </div>
          ))}
        </div>
      )}
      {cronDescription && cronDescription !== '—' && (
        <p className="mt-4 text-xs text-muted-foreground">调度说明：{cronDescription}</p>
      )}
    </div>
  );
}

function getToneStyles(tone: Tone) {
  return TONE_STYLES[tone] ?? TONE_STYLES.slate;
}

function getJobStatusMeta(status: string): JobStatusMeta {
  return JOB_STATUS_META[status] ?? DEFAULT_JOB_STATUS_META;
}

function MetaRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string | string[];
}) {
  const hintText =
    Array.isArray(hint) && hint.length > 0
      ? `后续：${hint.join('，')}`
      : typeof hint === 'string'
        ? hint
        : '';

  return (
    <div className="flex items-start justify-between gap-3 rounded-md bg-muted/30 px-2 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex-1 text-right">
        <p className="truncate text-sm font-medium text-foreground" title={value}>
          {value}
        </p>
        {hintText ? (
          <p className="truncate text-[11px] text-muted-foreground" title={hintText}>
            {hintText}
          </p>
        ) : null}
      </div>
    </div>
  );
}
