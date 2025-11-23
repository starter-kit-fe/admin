import type { JobLog } from '../../type';

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
    label: '执行成功',
    badge: 'secondary',
    dotClass: 'bg-primary',
    stepSurfaceClass: 'bg-primary/5',
    stepBorderClass: 'border-primary',
    stepTextClass: 'text-primary',
  },
  '1': {
    label: '执行失败',
    badge: 'destructive',
    dotClass: 'bg-rose-500',
    stepSurfaceClass: 'bg-rose-50/60',
    stepBorderClass: 'border-rose-200',
    stepTextClass: 'text-rose-700',
  },
  '2': {
    label: '执行中',
    badge: 'outline',
    dotClass: 'bg-sky-500',
    stepSurfaceClass: 'bg-sky-50/60',
    stepBorderClass: 'border-sky-200',
    stepTextClass: 'text-sky-700',
  },
};

export function getLogStatusMeta(status?: string) {
  return (
    LOG_STATUS_META[status ?? ''] ?? {
      label: '等待调度',
      badge: 'outline' as const,
      dotClass: 'bg-muted-foreground/50',
      stepSurfaceClass: 'bg-muted/20',
      stepBorderClass: 'border-border/70',
      stepTextClass: 'text-muted-foreground',
    }
  );
}

export function formatDuration(ms?: number): string {
  if (!ms || ms < 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}

export type JobLogStatusMeta = ReturnType<typeof getLogStatusMeta> & {
  label: string;
};

export type JobLogWithMeta = JobLog & { statusMeta?: JobLogStatusMeta };
