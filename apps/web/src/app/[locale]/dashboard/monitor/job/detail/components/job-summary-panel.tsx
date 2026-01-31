'use client';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { STATUS_BADGE_VARIANT } from '../../constants';
import type { Job } from '../../type';
import {
  resolveConcurrentLabel,
  resolveMisfireLabel,
  resolveStatusLabel,
} from '../../utils';

export function JobSummaryPanel({
  job,
  statusMeta,
  tone,
  nextExecution,
  cronDescription,
  formattedParams,
}: {
  job: Job;
  statusMeta: JobStatusMeta;
  tone: ToneStyles;
  nextExecution: string;
  cronDescription: string;
  formattedParams: string | undefined;
}) {
  const t = useTranslations('JobManagement');
  const StatusIcon = statusMeta.icon;
  const paramText = formattedParams ?? '';
  const shouldClampParams = paramText.length > 200;

  return (
    <aside className="space-y-3 ">
      <div className="grid gap-3 lg:grid-cols-[1fr_max-content]">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-lg border border-dashed',
              tone.bg,
              tone.text,
              tone.border,
            )}
          >
            <StatusIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-base font-semibold text-foreground">
                {job.jobName}
              </p>
              <Badge variant={STATUS_BADGE_VARIANT[job.status] ?? 'outline'}>
                {resolveStatusLabel(t, job.status)}
              </Badge>
              {job.isRunning ? (
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50/60 text-emerald-700"
                >
                  {job.currentLogId
                    ? t('detail.summary.runningTagWithLog', {
                        logId: job.currentLogId,
                      })
                    : t('detail.summary.runningTag')}
                </Badge>
              ) : null}
            </div>

            <p className="text-[11px] text-muted-foreground">
              {statusMeta.helperText}
            </p>
          </div>
        </div>
        <div className="rounded-md border border-dashed border-border/60 px-3 py-2 text-right">
          <p className="text-[11px] font-medium text-muted-foreground">
            {t('detail.summary.nextExecution.label')}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {nextExecution}
          </p>
          <p
            className="text-[11px] text-muted-foreground"
            title={cronDescription}
          >
            {cronDescription}
          </p>
        </div>
      </div>

      <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <SummaryItem
          label={t('detail.summary.labels.schedule')}
          value={resolveMisfireLabel(t, job.misfirePolicy)}
        />
        <SummaryItem
          label={t('detail.summary.labels.concurrency')}
          value={resolveConcurrentLabel(t, job.concurrent)}
        />
        <SummaryItem
<<<<<<<< HEAD:apps/web/src/app/[locale]/dashboard/monitor/job/detail/components/job-summary-panel.tsx
          label={t('detail.summary.labels.invokeTarget')}
          value={job.invokeTarget || '—'}
        />
        <SummaryItem
          label={t('detail.summary.labels.created')}
          value={job.createTime || '—'}
          hint={job.createBy || ''}
        />
        <SummaryItem
          label={t('detail.summary.labels.updated')}
          value={job.updateTime || '—'}
========
          label="创建"
          value={job.createdAt || '—'}
          hint={job.createBy || ''}
        />
        <SummaryItem
          label="更新"
          value={job.updatedAt || '—'}
>>>>>>>> main:apps/web/src/app/dashboard/monitor/job/detail/components/job-summary-panel.tsx
          hint={job.updateBy || ''}
        />
        {job.remark ? (
          <SummaryItem label={t('detail.summary.labels.remark')} value={job.remark} />
        ) : null}
      </div>

      <div className="rounded-md border border-dashed border-border/60 bg-muted/20 px-3 py-2.5">
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>{t('detail.summary.labels.params')}</span>
          {shouldClampParams && paramText ? (
            <span className="text-[11px]">
              {t('detail.summary.params.hint')}
            </span>
          ) : null}
        </div>
        {paramText ? (
          shouldClampParams ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="line-clamp-2 max-h-14 cursor-pointer whitespace-pre-wrap text-xs font-mono text-foreground">
                  {paramText}
                </div>
              </TooltipTrigger>
              <TooltipContent
                align="start"
                className="max-w-lg whitespace-pre-wrap font-mono text-xs"
              >
                {paramText}
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="whitespace-pre-wrap text-xs font-mono text-foreground">
              {paramText}
            </div>
          )
        ) : (
          <p className="text-xs text-muted-foreground">
            {t('detail.summary.params.empty')}
          </p>
        )}
      </div>
    </aside>
  );
}

export interface JobStatusMeta {
  label: string;
  helperText: string;
  icon: LucideIcon;
  tone: 'emerald' | 'amber' | 'sky' | 'rose' | 'slate';
}

export interface ToneStyles {
  bg: string;
  text: string;
  border: string;
}

function SummaryItem({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number | ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1 rounded-lg border border-border/60 bg-card/50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-medium text-foreground">{value || '—'}</div>
      {hint ? (
        <p className="text-[11px] text-muted-foreground" aria-hidden="true">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
