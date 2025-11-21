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
    <Empty className="border-0 bg-transparent py-6">
      <EmptyHeader>
        <EmptyTitle>
          {jobStatus === '0' ? '等待下一次调度' : '当前任务已暂停'}
        </EmptyTitle>
        <EmptyDescription>{waitingMessage}</EmptyDescription>
      </EmptyHeader>
      {upcomingExecutions.length > 0 && (
        <div className="mt-4 space-y-1 text-center text-xs text-muted-foreground">
          {upcomingExecutions.map((time, index) => (
            <div key={`${time}-${index}`}>
              {index === 0 ? '下一次' : `#${index + 1}`} 执行 · {time}
            </div>
          ))}
        </div>
      )}
      {cronDescription && cronDescription !== '—' ? (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          调度说明：{cronDescription}
        </p>
      ) : null}
    </Empty>
  );
}
