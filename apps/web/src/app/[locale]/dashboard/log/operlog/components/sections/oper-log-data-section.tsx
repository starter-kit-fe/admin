'use client';

import { PaginationToolbar } from '@/components/pagination/pagination-toolbar';
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect } from 'react';

import { listOperLogs } from '../../api';
import {
  BASE_OPER_LOG_QUERY_KEY,
  OPER_LOG_PAGE_SIZE_OPTIONS,
} from '../../constants';
import {
  useOperLogManagementSetRefreshHandler,
  useOperLogManagementSetRefreshing,
  useOperLogManagementStore,
} from '../../store';
import { OperLogTable } from '../list/oper-log-table';

export function OperLogDataSection() {
  const {
    appliedFilters,
    pagination,
    setPagination,
    logs,
    setLogs,
    total,
    setTotal,
    setDeleteTarget,
  } = useOperLogManagementStore();
  const setRefreshing = useOperLogManagementSetRefreshing();
  const setRefreshHandler = useOperLogManagementSetRefreshHandler();
  const queryClient = useQueryClient();

  const logQuery = useQuery({
    queryKey: [
      ...BASE_OPER_LOG_QUERY_KEY,
      appliedFilters.title,
      appliedFilters.operName,
      appliedFilters.businessType,
      appliedFilters.status,
      appliedFilters.requestMethod,
      pagination.pageNum,
      pagination.pageSize,
    ],
    queryFn: () =>
      listOperLogs({
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize,
        title: appliedFilters.title || undefined,
        operName: appliedFilters.operName || undefined,
        businessType:
          appliedFilters.businessType === 'all'
            ? undefined
            : appliedFilters.businessType,
        status:
          appliedFilters.status === 'all' ? undefined : appliedFilters.status,
        requestMethod:
          appliedFilters.requestMethod === 'all'
            ? undefined
            : appliedFilters.requestMethod,
      }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (logQuery.data) {
      setLogs(logQuery.data.items);
      setTotal(logQuery.data.total);
    }
  }, [logQuery.data, setLogs, setTotal]);

  useEffect(() => {
    setRefreshing(logQuery.isFetching);
  }, [logQuery.isFetching, setRefreshing]);

  useEffect(() => {
    setRefreshHandler(() => {
      void queryClient.invalidateQueries({
        queryKey: BASE_OPER_LOG_QUERY_KEY,
      });
    });
    return () => {
      setRefreshHandler(() => {});
    };
  }, [queryClient, setRefreshHandler]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, pageNum: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination((prev) => ({ ...prev, pageNum: 1, pageSize: size }));
  };

  const loading = logQuery.isLoading && logs.length === 0;
  const error = logQuery.isError && logs.length === 0;

  const showPagination = !loading && !error && total > 0;

  return (
    <div className="flex flex-col gap-4">
      <OperLogTable
        rows={logs}
        isLoading={loading}
        isError={error}
        onDelete={(log) => setDeleteTarget(log)}
      />

      {showPagination ? (
        <PaginationToolbar
          currentPage={pagination.pageNum}
          pageSize={pagination.pageSize}
          totalItems={total}
          pageSizeOptions={OPER_LOG_PAGE_SIZE_OPTIONS}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      ) : null}
    </div>
  );
}
