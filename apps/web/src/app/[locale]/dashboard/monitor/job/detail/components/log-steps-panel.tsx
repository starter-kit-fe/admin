'use client';

import { InlineLoading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { getJobLogSteps } from '../../api';
import { BASE_QUERY_KEY } from '../../constants';
import type { JobLog } from '../../type';
import { formatDuration, getLogStatusMeta } from './log-meta';

export function LogStepsPanel({ log }: { log: JobLog }) {
  const t = useTranslations('JobManagement');
  const {
    data: steps = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [...BASE_QUERY_KEY, 'logs', 'steps', log.id],
    queryFn: () => getJobLogSteps(log.id),
    enabled: Boolean(log.id),
    staleTime: 30 * 1000,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <FileText className="size-4" />
        {t('detail.live.steps.title')}
        <Badge variant="outline" className="px-2">
          {t('detail.live.steps.count', { count: steps.length })}
        </Badge>
        <span className="text-xs font-normal text-muted-foreground">
          {t('detail.live.steps.hint')}
        </span>
      </div>
      {isError ? (
        <div className="flex flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive sm:flex-row sm:items-center sm:justify-between">
          <span>{t('detail.live.steps.error')}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {t('detail.live.steps.retry')}
          </Button>
        </div>
      ) : null}
      <ScrollArea className="h-[420px] w-full rounded-lg border border-border/70 bg-muted/30">
        {isLoading ? (
          <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
            <InlineLoading label={t('detail.live.steps.loading')} />
          </div>
        ) : steps.length > 0 ? (
          <div className="space-y-2 p-2">
            {steps.map((step) => {
              const meta = getLogStatusMeta(step.status, t);
              const durationText = step.durationMs
                ? formatDuration(step.durationMs, t)
                : null;
              const contentPieces = [
                step.message,
                step.output,
                step.error,
              ].filter(Boolean) as string[];
              const content = contentPieces.join(' ');
              return (
                <div
                  key={step.stepId}
                  className={cn(
                    'w-full overflow-hidden rounded-lg px-3 py-2 text-sm leading-relaxed',
                    meta.stepSurfaceClass,
                    meta.stepBorderClass,
                  )}
                >
                  <div className="flex flex-col gap-2 text-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                    <div className="flex w-full items-center gap-2 sm:w-auto">
                      <span
                        className={cn(
                          'h-2.5 w-2.5 shrink-0 rounded-full',
                          meta.dotClass,
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 break-all font-semibold">
                        {t('detail.live.steps.stepLabel', {
                          order: step.stepOrder,
                          name: step.stepName,
                        })}
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-end flex-1 items-center gap-2 text-xs sm:text-sm sm:gap-3">
                      <span className={cn('font-medium', meta.stepTextClass)}>
                        {meta.label}
                      </span>
                      {durationText ? (
                        <span className="text-muted-foreground">
                          {t('detail.live.steps.duration', {
                            value: durationText,
                          })}
                        </span>
                      ) : null}
                      {step.createdAt ? (
                        <span className="text-muted-foreground sm:ml-auto sm:text-right">
                          {step.createdAt}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {content ? (
                    <div className="mt-1 whitespace-pre-wrap break-all text-xs leading-relaxed text-muted-foreground">
                      {content}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
            {t('detail.live.steps.empty')}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
