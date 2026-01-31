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
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useJobLogStream } from '../hooks/use-job-log-stream';
import type { JobLogStep } from '../type';
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
  const t = useTranslations('JobManagement');
  const { steps, isConnected, isComplete } = useJobLogStream({
    id: jobLogId,
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
            {isComplete
              ? allSuccess
                ? t('detail.live.status.success')
                : t('detail.live.status.failure')
              : t('detail.live.status.running')}
          </Badge>
          {hasError ? (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Bell className="size-3.5" />
              {t('detail.live.status.alert')}
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground sm:ml-auto">
          <span>{t('detail.live.steps.count', { count: steps.length })}</span>
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
              ? t('detail.live.connection.active')
              : isComplete
                ? t('detail.live.connection.complete')
                : t('detail.live.connection.waiting')}
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
              t={t}
            />
          ))}

          {steps.length === 0 ? (
            <div className="flex items-center justify-center rounded-md border border-dashed border-border/70 bg-muted/30 p-6 text-sm text-muted-foreground">
              {isComplete ? (
                t('detail.live.steps.empty')
              ) : (
                <InlineLoading label={t('detail.live.waitingStart')} />
              )}
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}

function StepItem({
  step,
  isActive,
  t,
}: {
  step: JobLogStep;
  isActive: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const [expanded, setExpanded] = useState(true);
  const meta = getLogStatusMeta(step.status, t);
  const durationText =
    step.durationMs !== undefined && step.durationMs >= 0
      ? formatDuration(step.durationMs, t)
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
            {t('detail.live.steps.stepLabel', {
              order: step.stepOrder,
              name: step.stepName,
            })}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:ml-auto sm:text-sm sm:gap-3">
          <span className={cn('font-medium', meta.stepTextClass)}>
            {meta.label}
          </span>
          {durationText ? (
            <span>
              {t('detail.live.steps.duration', { value: durationText })}
            </span>
          ) : null}
          {step.createdAt ? <span>{step.createdAt}</span> : null}
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
              {expanded
                ? t('detail.live.steps.collapse')
                : t('detail.live.steps.expand')}
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
