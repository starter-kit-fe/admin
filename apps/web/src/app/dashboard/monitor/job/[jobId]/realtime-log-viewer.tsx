'use client';

import { InlineLoading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

import type { JobLogStep } from '../type';
import { useJobLogStream } from '../hooks/use-job-log-stream';
import { formatDuration, getLogStatusMeta } from './components/log-meta';

interface RealtimeLogViewerProps {
  jobLogId: number;
  jobName: string;
  onComplete?: () => void;
}

export function RealtimeLogViewer({
  jobLogId,
  jobName,
  onComplete,
}: RealtimeLogViewerProps) {
  const { steps, isConnected, isComplete } = useJobLogStream({
    jobLogId,
    onComplete,
  });

  const allSuccess = steps.length > 0 && steps.every((s) => s.status === '0');
  const hasError = steps.some((s) => s.status === '1');

  return (
    <div
      className={cn(
        'rounded-lg border bg-card',
        !isComplete && 'border-sky-200 shadow-sm',
      )}
    >
      <div className="flex flex-wrap items-center gap-3 border-b bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          {isComplete ? (
            allSuccess ? (
              <CheckCircle2 className="size-5 text-primary" />
            ) : (
              <XCircle className="size-5 text-rose-600" />
            )
          ) : (
            <Loader2 className="size-5 animate-spin text-sky-600" />
          )}
          <span className="text-sm font-semibold text-foreground">
            {jobName}
          </span>
          <Badge
            variant={
              isComplete
                ? allSuccess
                  ? 'secondary'
                  : 'destructive'
                : 'outline'
            }
            className="border-dashed"
          >
            {isComplete ? (allSuccess ? '成功' : '失败') : '执行中'}
          </Badge>
          {hasError ? (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Bell className="size-3.5" />
              异常
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground sm:ml-auto">
          <span>{steps.length} 个步骤</span>
          <span
            className={cn(
              'flex items-center gap-1',
              isConnected ? 'text-emerald-600' : 'text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                isConnected ? 'bg-emerald-500' : 'bg-muted-foreground/60',
              )}
            />
            {isConnected
              ? '实时推送中'
              : isComplete
                ? '任务已完成'
                : '等待连接'}
          </span>
        </div>
      </div>

      <ScrollArea className="max-h-[560px]">
        <div className="space-y-2 p-2">
          {steps.map((step) => (
            <StepItem
              key={step.stepId}
              step={step}
              isActive={!isComplete && step.status === '2'}
            />
          ))}

          {steps.length === 0 ? (
            <div className="flex items-center justify-center rounded-md border border-dashed border-border/70 bg-muted/30 p-6 text-sm text-muted-foreground">
              {isComplete ? (
                '暂无步骤日志'
              ) : (
                <InlineLoading label="等待任务开始..." />
              )}
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}

function StepItem({ step, isActive }: { step: JobLogStep; isActive: boolean }) {
  const [expanded, setExpanded] = useState(true);
  const meta = getLogStatusMeta(step.status);
  const durationText =
    step.durationMs !== undefined && step.durationMs >= 0
      ? formatDuration(step.durationMs)
      : null;
  const hasDetails = Boolean(step.message || step.output || step.error);

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-lg border px-3 py-2 text-sm leading-relaxed transition-colors',
        meta.stepSurfaceClass,
        meta.stepBorderClass,
        isActive && 'ring-1 ring-sky-200 shadow-sm',
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn('h-2.5 w-2.5 shrink-0 rounded-full', meta.dotClass)}
            aria-hidden
          />
          <span className="min-w-0 break-all font-semibold">
            步骤 {step.stepOrder}: {step.stepName}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:ml-auto sm:text-sm sm:gap-3">
          <span className={cn('font-medium', meta.stepTextClass)}>
            {meta.label}
          </span>
          {durationText ? <span>耗时 {durationText}</span> : null}
          {step.createTime ? <span>{step.createTime}</span> : null}
          {hasDetails ? (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="flex items-center gap-1 rounded border px-2 py-1 text-[11px] text-foreground/70 transition-colors hover:bg-background/70"
            >
              {expanded ? (
                <ChevronDown className="size-3" />
              ) : (
                <ChevronRight className="size-3" />
              )}
              {expanded ? '收起' : '展开'}
            </button>
          ) : null}
        </div>
      </div>

      {expanded && hasDetails ? (
        <div className="mt-1 space-y-2 rounded-md bg-background/80 p-3 text-xs leading-relaxed text-foreground">
          {step.message ? (
            <p className="whitespace-pre-wrap text-muted-foreground">
              {step.message}
            </p>
          ) : null}
          {step.output ? (
            <pre className="whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-foreground">
              {step.output}
            </pre>
          ) : null}
          {step.error ? (
            <pre className="whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-destructive">
              {step.error}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
