'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';

import { PaginationToolbar } from '@/components/pagination/pagination-toolbar';
import { InlineLoading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { getJobDetail } from '../../api';
import { BASE_QUERY_KEY, STATUS_BADGE_VARIANT } from '../../constants';
import type { Job, JobLog } from '../../type';
import {
  resolveConcurrentLabel,
  resolveMisfireLabel,
  resolveStatusLabel,
  stringifyInvokeParams,
} from '../../utils';

const LOG_PAGE_SIZES = [5, 10, 20];
const DEFAULT_LOG_PAGE_SIZE = 10;

interface JobDetailContentProps {
  jobId: number;
}

export function JobDetailContent({ jobId }: JobDetailContentProps) {
  const [logPagination, setLogPagination] = useState({
    pageNum: 1,
    pageSize: DEFAULT_LOG_PAGE_SIZE,
  });

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

  const formattedParams = useMemo(() => {
    return stringifyInvokeParams(detail?.invokeParamsText ?? job?.invokeParams);
  }, [detail?.invokeParamsText, job?.invokeParams]);

  const summaryFields = useMemo(() => {
    if (!job) {
      return [];
    }
    return [
      { label: '任务名称', value: job.jobName || '—' },
      { label: '任务分组', value: job.jobGroup || 'DEFAULT' },
      { label: '调用目标', value: job.invokeTarget || '—' },
      { label: 'Cron 表达式', value: job.cronExpression || '—' },
      { label: '调度策略', value: resolveMisfireLabel(job.misfirePolicy) },
      { label: '并发策略', value: resolveConcurrentLabel(job.concurrent) },
      {
        label: '当前状态',
        value: (
          <Badge variant={STATUS_BADGE_VARIANT[job.status] ?? 'outline'}>
            {resolveStatusLabel(job.status)}
          </Badge>
        ),
      },
      { label: '备注', value: job.remark || '—' },
      { label: '创建人', value: job.createBy || '—' },
      { label: '创建时间', value: job.createTime || '—' },
      { label: '更新人', value: job.updateBy || '—' },
      { label: '更新时间', value: job.updateTime || '—' },
    ];
  }, [job]);

  const handleLogPageChange = (page: number) => {
    setLogPagination((prev) => ({ ...prev, pageNum: page }));
  };

  const handleLogPageSizeChange = (size: number) => {
    setLogPagination({ pageNum: 1, pageSize: size });
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => detailQuery.refetch()}
          disabled={detailQuery.isFetching}
          className="ml-auto flex items-center gap-2"
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
          <div className="space-y-6">
            <section className="grid gap-4 text-sm md:grid-cols-2">
              {summaryFields.map((field) => (
                <div
                  key={field.label}
                  className="space-y-1 rounded-lg border border-border/60 p-3"
                >
                  <p className="text-xs text-muted-foreground">
                    {field.label}
                  </p>
                  <div className="font-medium text-foreground">
                    {field.value ?? '—'}
                  </div>
                </div>
              ))}
            </section>

            <section className="space-y-2">
              <p className="text-sm font-medium text-foreground">调用参数</p>
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

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">执行日志</p>
                <p className="text-xs text-muted-foreground">
                  共 {logs?.total ?? 0} 条
                </p>
              </div>
              {logs && logs.items.length > 0 ? (
                <div className="space-y-3">
                  {logs.items.map((log) => (
                    <JobLogEntry key={log.jobLogId} log={log} />
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
                <div className="rounded-lg border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
                  暂无执行记录。
                </div>
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

function JobLogEntry({ log }: { log: JobLog }) {
  const status =
    log.status === '0' ? '成功' : log.status === '1' ? '失败' : '未知';
  const variant =
    STATUS_BADGE_VARIANT[log.status] ??
    (log.status === '0' ? 'secondary' : 'outline');

  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-card/40 p-3">
      <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>执行时间：{log.createTime || '—'}</span>
        <Badge variant={variant}>{status}</Badge>
      </div>
      <div className="rounded-md bg-muted/40 px-3 py-2 text-sm text-foreground">
        {log.jobMessage || '无日志描述'}
      </div>
      {log.exception ? (
        <pre className="whitespace-pre-wrap break-words rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {log.exception}
        </pre>
      ) : null}
    </div>
  );
}
