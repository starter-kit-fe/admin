'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2, Clock, FileText, Loader2, XCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { JobLog, JobLogStep } from '../../type';

interface JobLogsViewerProps {
  logs: JobLog[];
  isLoading?: boolean;
}

const LOG_STATUS_META: Record<string, {
  label: string;
  badge: 'secondary' | 'destructive' | 'outline';
  icon: typeof CheckCircle2;
  tone: string;
  bg: string;
  animate?: boolean;
}> = {
  '0': {
    label: '执行成功',
    badge: 'secondary',
    icon: CheckCircle2,
    tone: 'text-emerald-600 dark:text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  '1': {
    label: '执行失败',
    badge: 'destructive',
    icon: XCircle,
    tone: 'text-rose-600 dark:text-rose-500',
    bg: 'bg-rose-500/10',
  },
  '2': {
    label: '执行中',
    badge: 'outline',
    icon: Loader2,
    tone: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-500/10',
    animate: true,
  },
};

function getLogStatusMeta(status: string) {
  return LOG_STATUS_META[status] ?? {
    label: '等待调度',
    badge: 'outline' as const,
    icon: Clock,
    tone: 'text-muted-foreground',
    bg: 'bg-muted/40',
  };
}

export function JobLogsViewer({ logs, isLoading }: JobLogsViewerProps) {
  const [selectedLogId, setSelectedLogId] = useState<number | null>(
    logs[0]?.jobLogId ?? null,
  );

  useEffect(() => {
    if (logs.length === 0) {
      setSelectedLogId(null);
      return;
    }
    if (!logs.some((log) => log.jobLogId === selectedLogId)) {
      setSelectedLogId(logs[0]?.jobLogId ?? null);
    }
  }, [logs, selectedLogId]);

  const selectedLog = useMemo(
    () => logs.find((log) => log.jobLogId === selectedLogId),
    [logs, selectedLogId],
  );

  if (isLoading) {
    return (
      <div className="flex h-[560px] items-center justify-center rounded-xl border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          加载中...
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return null;
  }

  return (
    <div className="grid h-[560px] grid-cols-1 overflow-hidden rounded-xl border bg-card lg:grid-cols-[320px_1fr]">
      <div className="border-r bg-muted/30">
        <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h3 className="text-sm font-semibold">执行历史</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">共 {logs.length} 条记录</p>
        </div>
        <ScrollArea className="h-[calc(100%-60px)]">
          <div className="space-y-1 p-2">
            {logs.map((log) => (
              <LogListItem
                key={log.jobLogId}
                log={log}
                isSelected={log.jobLogId === selectedLogId}
                onClick={() => setSelectedLogId(log.jobLogId)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="overflow-hidden bg-background">
        {selectedLog ? (
          <LogDetailPanel log={selectedLog} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            选择一条记录查看详情
          </div>
        )}
      </div>
    </div>
  );
}

function LogListItem({
  log,
  isSelected,
  onClick,
}: {
  log: JobLog;
  isSelected: boolean;
  onClick: () => void;
}) {
  const meta = getLogStatusMeta(log.status);
  const Icon = meta.icon;
  const isRunning = log.status === '2';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-lg px-3 py-2.5 text-left transition-colors',
        'hover:bg-accent/80',
        isSelected && 'border border-accent-foreground/20 bg-accent shadow-sm',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg',
            meta.bg,
            meta.tone,
            isRunning && 'animate-pulse',
          )}
        >
          <Icon className={cn('size-4', isRunning && 'animate-spin')} />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={meta.badge} className="px-2 text-xs">
              {meta.label}
            </Badge>
            {log.jobMessage ? (
              <span className="line-clamp-1 text-xs text-foreground/70">
                {log.jobMessage}
              </span>
            ) : null}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {log.createTime || '—'}
          </p>
          {log.invokeTarget ? (
            <p className="truncate text-[11px] font-mono text-muted-foreground">
              {log.invokeTarget}
            </p>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function LogDetailPanel({ log }: { log: JobLog }) {
  const meta = getLogStatusMeta(log.status);
  const Icon = meta.icon;
  const hasSteps = (log.steps?.length ?? 0) > 0;
  const durationText = log.durationMs ? formatDuration(log.durationMs) : null;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-6">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl',
              meta.bg,
              meta.tone,
              meta.animate && 'animate-pulse',
            )}
          >
            <Icon className={cn('size-5', meta.animate && 'animate-spin')} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{log.jobName || '任务执行'}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>日志 ID #{log.jobLogId}</span>
              <span>·</span>
              <span>{log.createTime || '—'}</span>
              {durationText ? (
                <>
                  <span>·</span>
                  <span>耗时 {durationText}</span>
                </>
              ) : null}
            </div>
          </div>
          <Badge variant={meta.badge}>{meta.label}</Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoField label="任务分组" value={log.jobGroup || '—'} />
          <InfoField label="调用目标" value={log.invokeTarget || '—'} />
          <InfoField
            label="执行状态"
            value={<Badge variant={meta.badge}>{meta.label}</Badge>}
          />
          <InfoField label="执行时间" value={log.createTime || '—'} />
        </div>

        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="size-4" />
            步骤日志
          </h3>
          {hasSteps ? (
            <div className="space-y-3">
              {log.steps?.map((step) => (
                <StepCard key={step.stepId} step={step} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">暂无步骤日志</p>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Clock className="size-4" />
            执行消息
          </h3>
          <div className="rounded-lg border border-border/60 bg-muted/50 p-4 text-sm">
            {log.jobMessage || '未返回执行消息'}
          </div>
        </div>

        {log.exception ? (
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <XCircle className="size-4" />
              异常信息
            </h3>
            <pre className="whitespace-pre-wrap break-words rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
              {log.exception}
            </pre>
          </div>
        ) : null}
      </div>
    </ScrollArea>
  );
}

function StepCard({ step }: { step: JobLogStep }) {
  const meta = getLogStatusMeta(step.status);
  const durationText = step.durationMs ? formatDuration(step.durationMs) : null;
  const isRunning = step.status === '2';

  return (
    <div
      className={cn(
        'space-y-2 rounded-lg border border-border/70 bg-card/80 p-3',
        isRunning && 'ring-1 ring-sky-200 animate-pulse',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              meta.bg,
              meta.tone,
              meta.animate && 'animate-pulse',
            )}
          >
            <meta.icon className={cn('size-5', meta.animate && 'animate-spin')} />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {step.stepName}
            </p>
            <p className="text-xs text-muted-foreground">
              步骤 {step.stepOrder}
              {durationText ? ` · ${durationText}` : ''}
            </p>
          </div>
        </div>
        <Badge variant={meta.badge}>{meta.label}</Badge>
      </div>

      {step.message ? (
        <p className="whitespace-pre-wrap break-words rounded-md bg-muted/40 px-3 py-2 text-xs text-foreground">
          {step.message}
        </p>
      ) : null}

      {step.output ? (
        <pre className="max-h-60 whitespace-pre-wrap break-words rounded-md bg-muted/50 px-3 py-2 text-xs font-mono text-foreground">
          {step.output}
        </pre>
      ) : null}

      {step.error ? (
        <pre className="whitespace-pre-wrap break-words rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {step.error}
        </pre>
      ) : null}
    </div>
  );
}

function InfoField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="space-y-1 rounded-lg border border-border/60 bg-card/50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-medium text-foreground">{value || '—'}</div>
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}
