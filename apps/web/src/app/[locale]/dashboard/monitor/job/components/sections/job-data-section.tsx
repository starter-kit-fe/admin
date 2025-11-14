'use client';

import { PaginationToolbar } from '@/components/pagination/pagination-toolbar';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  changeJobStatus,
  listJobs,
  runJob,
} from '../../api';
import {
  BASE_QUERY_KEY,
  DEFAULT_PAGINATION,
  PAGE_SIZE_OPTIONS,
} from '../../constants';
import {
  useJobManagementMutationCounter,
  useJobManagementRefresh,
  useJobManagementSetRefreshHandler,
  useJobManagementSetRefreshing,
  useJobManagementStatus,
  useJobManagementStore,
} from '../../store';
import type { Job } from '../../type';
import { JobTable } from '../list/job-table';

export function JobDataSection() {
  const {
    appliedFilters,
    pagination,
    setPagination,
    setDeleteTarget,
  } = useJobManagementStore();
  const refresh = useJobManagementRefresh();
  const setRefreshing = useJobManagementSetRefreshing();
  const setRefreshHandler = useJobManagementSetRefreshHandler();
  const { isMutating } = useJobManagementStatus();
  const { beginMutation, endMutation } = useJobManagementMutationCounter();

  const [pendingRunId, setPendingRunId] = useState<number | null>(null);
  const [pendingStatusId, setPendingStatusId] = useState<number | null>(null);

  const queryParams = useMemo(
    () => ({
      jobName: appliedFilters.jobName || undefined,
      jobGroup: appliedFilters.jobGroup || undefined,
      status:
        appliedFilters.status === 'all' ? undefined : appliedFilters.status,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
    }),
    [
      appliedFilters.jobName,
      appliedFilters.jobGroup,
      appliedFilters.status,
      pagination.pageNum,
      pagination.pageSize,
    ],
  );

  const jobListQuery = useQuery({
    queryKey: [
      ...BASE_QUERY_KEY,
      queryParams.jobName ?? '',
      queryParams.jobGroup ?? '',
      queryParams.status ?? 'all',
      queryParams.pageNum,
      queryParams.pageSize,
    ],
    queryFn: () => listJobs(queryParams),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    setRefreshing(jobListQuery.isFetching);
  }, [jobListQuery.isFetching, setRefreshing]);

  useEffect(() => {
    const refetch = jobListQuery.refetch;
    setRefreshHandler(() => {
      void refetch();
    });
    return () => {
      setRefreshHandler(() => {});
    };
  }, [jobListQuery.refetch, setRefreshHandler]);

  const rows = jobListQuery.data?.items ?? [];
  const total = jobListQuery.data?.total ?? 0;

  const handlePageChange = (pageNum: number) => {
    setPagination((prev) => ({ ...prev, pageNum }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination({ pageNum: DEFAULT_PAGINATION.pageNum, pageSize });
  };

  const handleSelectDelete = (job: Job) => {
    setDeleteTarget(job);
  };

  const runJobMutation = useMutation({
    mutationFn: (jobId: number) => runJob(jobId),
    onMutate: (jobId) => {
      beginMutation();
      setPendingRunId(jobId);
    },
    onSuccess: () => {
      toast.success('任务已提交执行');
      refresh();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : '操作失败，请稍后重试';
      toast.error(message);
    },
    onSettled: () => {
      endMutation();
      setPendingRunId(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({
      jobId,
      nextStatus,
    }: {
      jobId: number;
      nextStatus: string;
    }) => {
      await changeJobStatus(jobId, nextStatus);
      return { nextStatus };
    },
    onMutate: ({ jobId }) => {
      beginMutation();
      setPendingStatusId(jobId);
    },
    onSuccess: ({ nextStatus }) => {
      toast.success(nextStatus === '0' ? '任务已恢复' : '任务已暂停');
      refresh();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : '更新任务状态失败，请稍后重试';
      toast.error(message);
    },
    onSettled: () => {
      endMutation();
      setPendingStatusId(null);
    },
  });

  const handleRunJob = (jobId: number) => {
    if (runJobMutation.isPending) {
      return;
    }
    runJobMutation.mutate(jobId);
  };

  const handleToggleStatus = (jobId: number, nextStatus: string) => {
    if (statusMutation.isPending) {
      return;
    }
    statusMutation.mutate({ jobId, nextStatus });
  };

  const isTableLoading = jobListQuery.isLoading && rows.length === 0;
  const showPagination =
    !isTableLoading && !jobListQuery.isError && total > 0;

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card">
        <JobTable
          rows={rows}
          isLoading={isTableLoading}
          isError={jobListQuery.isError}
          pendingRunId={runJobMutation.isPending ? pendingRunId : null}
          pendingStatusId={statusMutation.isPending ? pendingStatusId : null}
          onRunJob={handleRunJob}
          onToggleStatus={handleToggleStatus}
          onDelete={handleSelectDelete}
        />
      </section>

      {showPagination ? (
        <PaginationToolbar
          totalItems={total}
          currentPage={pagination.pageNum}
          pageSize={pagination.pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          disabled={jobListQuery.isFetching || isMutating}
        />
      ) : null}
    </div>
  );
}
