import type { JobLog } from '../../type';

type Translator = (key: string, values?: Record<string, string | number>) => string;

const LOG_STATUS_META: Record<
  string,
  {
    label: string;
    badge: 'secondary' | 'destructive' | 'outline';
    dotClass: string;
    stepSurfaceClass: string;
    stepBorderClass: string;
    stepTextClass: string;
  }
> = {
  '0': {
    label: 'Succeeded',
    badge: 'secondary',
    dotClass: 'bg-primary',
    stepSurfaceClass: 'bg-primary/5',
    stepBorderClass: 'border-primary',
    stepTextClass: 'text-primary',
  },
  '1': {
    label: 'Failed',
    badge: 'destructive',
    dotClass: 'bg-rose-500',
    stepSurfaceClass: 'bg-rose-50/60',
    stepBorderClass: 'border-rose-200',
    stepTextClass: 'text-rose-700',
  },
  '2': {
    label: 'Running',
    badge: 'outline',
    dotClass: 'bg-sky-500',
    stepSurfaceClass: 'bg-sky-50/60',
    stepBorderClass: 'border-sky-200',
    stepTextClass: 'text-sky-700',
  },
};

export function getLogStatusMeta(status?: string, t?: Translator) {
  if (t) {
    const key =
      status === '0'
        ? 'detail.logs.status.success'
        : status === '1'
          ? 'detail.logs.status.failure'
          : status === '2'
            ? 'detail.logs.status.running'
            : 'detail.logs.status.pending';
    const label = t(key);
    const base =
      LOG_STATUS_META[status ?? ''] ??
      LOG_STATUS_META['2'] ??
      (LOG_STATUS_META['0'] as (typeof LOG_STATUS_META)[string]);
    return { ...base, label };
  }
  return (
    LOG_STATUS_META[status ?? ''] ?? {
      label: 'Pending',
      badge: 'outline' as const,
      dotClass: 'bg-muted-foreground/50',
      stepSurfaceClass: 'bg-muted/20',
      stepBorderClass: 'border-border/70',
      stepTextClass: 'text-muted-foreground',
    }
  );
}

export function formatDuration(
  ms?: number,
  t?: Translator,
): string {
  if (!ms || ms < 0) return '—';
  if (ms < 1000) return t ? t('detail.logs.duration.ms', { value: ms }) : `${ms}ms`;
  const seconds = (ms / 1000).toFixed(1);
  return t ? t('detail.logs.duration.seconds', { value: seconds }) : `${seconds}s`;
}

export type JobLogStatusMeta = ReturnType<typeof getLogStatusMeta> & {
  label: string;
};

export type JobLogWithMeta = JobLog & { statusMeta?: JobLogStatusMeta };
