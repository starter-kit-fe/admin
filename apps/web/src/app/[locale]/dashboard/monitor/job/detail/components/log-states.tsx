'use client';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';

export function AwaitingExecutionState({
  jobStatus,
  upcomingExecutions,
  cronDescription,
  t,
}: {
  jobStatus: string;
  upcomingExecutions: string[];
  cronDescription: string;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const waitingMessage =
    jobStatus === '0'
      ? t('detail.logs.empty.descriptionActive')
      : t('detail.logs.empty.descriptionPaused');

  return (
    <Empty className="border-0 bg-transparent py-6">
      <EmptyHeader>
        <EmptyTitle>
          {jobStatus === '0'
            ? t('detail.logs.empty.titleActive')
            : t('detail.logs.empty.titlePaused')}
        </EmptyTitle>
        <EmptyDescription>{waitingMessage}</EmptyDescription>
      </EmptyHeader>
      {upcomingExecutions.length > 0 && (
        <div className="mt-4 space-y-1 text-center text-xs text-muted-foreground">
          {upcomingExecutions.map((time, index) => (
            <div key={`${time}-${index}`}>
              {index === 0
                ? t('detail.logs.empty.nextExecution', { time })
                : t('detail.logs.empty.nthExecution', {
                    index: index + 1,
                    time,
                  })}
            </div>
          ))}
        </div>
      )}
      {cronDescription && cronDescription !== '—' ? (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {t('detail.logs.empty.schedule', {
            description: cronDescription,
          })}
        </p>
      ) : null}
    </Empty>
  );
}
