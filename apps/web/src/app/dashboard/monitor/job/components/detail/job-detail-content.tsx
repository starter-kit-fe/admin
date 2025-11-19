'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Braces,
  CalendarClock,
  CheckCircle2,
  Clock3,
  History,
  Info,
  Loader2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  XCircle,
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
import type { Job, JobLog } from '../../type';
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

interface LogStatusMeta {
  label: string;
  description: string;
  icon: LucideIcon;
  badgeVariant: 'secondary' | 'destructive' | 'outline';
  tone: Tone;
}

const LOG_STATUS_META: Record<string, LogStatusMeta> = {
  '0': {
    label: '执行成功',
    description: '任务执行完成且未返回错误。',
    icon: CheckCircle2,
    badgeVariant: 'secondary',
    tone: 'emerald',
  },
  '1': {
    label: '执行失败',
    description: '任务执行失败，请查看异常信息。',
    icon: XCircle,
    badgeVariant: 'destructive',
    tone: 'rose',
  },
};

const DEFAULT_LOG_STATUS_META: LogStatusMeta = {
  label: '等待调度',
  description: '任务等待下一次调度或状态尚未更新。',
  icon: AlertCircle,
  badgeVariant: 'outline',
  tone: 'sky',
};

interface JobDetailContentProps {
  jobId: number;
}

export function JobDetailContent({ jobId }: JobDetailContentProps) {
  const [logPagination, setLogPagination] = useState({
    pageNum: 1,
    pageSize: DEFAULT_LOG_PAGE_SIZE,
  });
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
    onSuccess: () => {
      toast.success('任务已提交执行');
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

  const summaryFields = useMemo(() => {
    if (!job) {
      return [];
    }
    return [
      { label: '调用目标', value: job.invokeTarget || '—' },
      { label: '调度策略', value: resolveMisfireLabel(job.misfirePolicy) },
      { label: '并发策略', value: resolveConcurrentLabel(job.concurrent) },
      { label: '备注', value: job.remark || '—' },
      { label: '创建人', value: job.createBy || '—' },
      { label: '创建时间', value: job.createTime || '—' },
      { label: '更新人', value: job.updateBy || '—' },
      { label: '更新时间', value: job.updateTime || '—' },
    ];
  }, [job]);

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

  const lastLog = logs?.items[0];
  const lastLogMeta = lastLog ? resolveLogStatusMeta(lastLog.status) : null;
  const totalRuns = logs?.total ?? 0;

  const overviewCards = useMemo<InfoCardConfig[]>(() => {
    return [
      {
        label: '下一次执行',
        value:
          upcomingExecutions[0] ??
          (job?.cronExpression ? '等待调度' : '未设置 Cron 表达式'),
        description:
          upcomingExecutions.length > 1
            ? `后续：${upcomingExecutions.slice(1).join('，')}`
            : job?.cronExpression
            ? 'Cron 计划已就绪'
            : '请配置 Cron 规则',
        icon: CalendarClock,
      },
      {
        label: 'Cron 描述',
        value: cronDescription,
        description: job?.cronExpression || '没有可用的 Cron 表达式',
        icon: Activity,
      },
      {
        label: '最近执行',
        value: lastLog
          ? `${lastLogMeta?.label ?? ''} · ${lastLog.createTime || '—'}`
          : job?.status === '0'
          ? '等待首次执行'
          : '任务已暂停',
        description:
          lastLog?.jobMessage ||
          (job?.status === '0'
            ? '任务已排队，耐心等待计划触发即可'
            : '恢复任务以重新开始调度'),
        icon: History,
      },
      {
        label: '执行日志',
        value: `${totalRuns} 条`,
        description:
          totalRuns > 0 ? '可在下方时间线中查看详情' : '暂无执行记录',
        icon: Loader2,
      },
    ];
  }, [cronDescription, job?.cronExpression, job?.status, lastLog, lastLogMeta?.label, lastLog?.jobMessage, lastLog?.createTime, totalRuns, upcomingExecutions]);

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
    runJobMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/monitor/job" className="flex items-center gap-2">
            <ArrowLeft className="size-4" />
            返回列表
          </Link>
        </Button>
        <div className="ml-auto flex items-center gap-2">
          {job && canRunJob ? (
            <Button
              variant="default"
              size="sm"
              onClick={handleTriggerJob}
              disabled={runJobMutation.isPending}
              className="flex items-center gap-2"
            >
              {runJobMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  触发中...
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

      <div className="rounded-xl border border-border/60 bg-card p-6">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <InlineLoading label="正在加载任务详情..." />
          </div>
        ) : hasError ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-10 text-center text-sm text-destructive">
            加载失败，请稍后再试。
          </div>
        ) : job ? (
          <div className="space-y-8">
            <JobHero job={job} cronExpression={job.cronExpression} />

            <section>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {overviewCards.map((card) => (
                  <InfoCard key={card.label} {...card} />
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Info className="size-4 text-muted-foreground" />
                <span>任务配置</span>
              </div>
              <div className="grid gap-4 text-sm md:grid-cols-2">
                {summaryFields.map((field) => (
                  <div
                    key={field.label}
                    className="space-y-1 rounded-lg border border-border/60 p-3"
                  >
                    <p className="text-xs text-muted-foreground">{field.label}</p>
                    <div className="font-medium text-foreground">
                      {field.value ?? '—'}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Braces className="size-4 text-muted-foreground" />
                <span>调用参数</span>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                {formattedParams ? (
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs font-mono text-foreground">
                    {formattedParams}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">未配置参数</p>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Activity className="size-4 text-muted-foreground" />
                  <span>执行时间线</span>
                </div>
                <p className="text-xs text-muted-foreground">共 {logs?.total ?? 0} 条</p>
              </div>
              {logs && logs.items.length > 0 ? (
                <div className="space-y-4">
                  {logs.items.map((log, index) => (
                    <JobLogTimelineItem
                      key={log.jobLogId}
                      log={log}
                      isLast={index === logs.items.length - 1}
                    />
                  ))}
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
              ) : (
                <AwaitingExecutionState
                  jobStatus={job.status}
                  cronDescription={cronDescription}
                  upcomingExecutions={upcomingExecutions}
                />
              )}
            </section>
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

interface InfoCardConfig {
  label: string;
  value: ReactNode;
  description?: ReactNode;
  icon: LucideIcon;
}

function InfoCard({ label, value, description, icon: Icon }: InfoCardConfig) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="text-sm font-semibold text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

function JobHero({ job, cronExpression }: { job: Job; cronExpression?: string }) {
  const statusMeta = getJobStatusMeta(job.status);
  const tone = getToneStyles(statusMeta.tone);
  const StatusIcon = statusMeta.icon;

  return (
    <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-background via-card to-muted/30 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-2xl border-2',
              tone.bg,
              tone.text,
              tone.border
            )}
          >
            <StatusIcon className="size-7" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {job.jobGroup || 'DEFAULT'} · ID #{job.jobId}
            </p>
            <p className="text-2xl font-semibold text-foreground">{job.jobName}</p>
            <p className="text-sm text-muted-foreground">
              {job.invokeTarget || '未配置调用目标'}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <Badge variant={STATUS_BADGE_VARIANT[job.status] ?? 'outline'}>
            {resolveStatusLabel(job.status)}
          </Badge>
          <p className="text-xs text-muted-foreground text-left md:text-right">
            {statusMeta.helperText}
          </p>
          {cronExpression && (
            <span className="rounded-md bg-muted/50 px-2 py-1 text-xs font-mono text-muted-foreground">
              {cronExpression}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function JobLogTimelineItem({ log, isLast }: { log: JobLog; isLast: boolean }) {
  const meta = resolveLogStatusMeta(log.status);
  const tone = getToneStyles(meta.tone);
  const Icon = meta.icon;

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background',
            tone.bg,
            tone.text,
            tone.border
          )}
        >
          <Icon className="size-5" />
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-border/60" />}
      </div>
      <div className="flex-1 rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
            <span className="text-xs text-muted-foreground">
              日志 ID：#{log.jobLogId ?? '—'}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {log.createTime || '—'}
          </span>
        </div>
        <p className="mt-2 text-sm text-foreground">
          {log.jobMessage || meta.description}
        </p>
        {log.exception ? (
          <pre className="mt-3 whitespace-pre-wrap break-words rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {log.exception}
          </pre>
        ) : null}
      </div>
    </div>
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

function resolveLogStatusMeta(status: string): LogStatusMeta {
  return LOG_STATUS_META[status] ?? DEFAULT_LOG_STATUS_META;
}
