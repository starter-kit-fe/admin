'use client';

import { PaginationToolbar } from '@/components/pagination/pagination-toolbar';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { listLoginLogs } from '../../api';
import {
  BASE_LOGIN_LOG_QUERY_KEY,
  LOGIN_LOG_PAGE_SIZE_OPTIONS,
} from '../../constants';
import {
  useLoginLogManagementSetRefreshHandler,
  useLoginLogManagementSetRefreshing,
  useLoginLogManagementStatus,
  useLoginLogManagementStore,
} from '../../store';
import { LoginLogTable } from '../list/login-log-table';

export function LoginLogDataSection() {
  const {
    status,
    appliedFilters,
    pagination,
    setPagination,
    logs,
    setLogs,
    total,
    setTotal,
    setDeleteTarget,
  } = useLoginLogManagementStore();
  const { isMutating } = useLoginLogManagementStatus();
  const setRefreshing = useLoginLogManagementSetRefreshing();
  const setRefreshHandler = useLoginLogManagementSetRefreshHandler();

  const logQuery = useQuery({
    queryKey: [
      ...BASE_LOGIN_LOG_QUERY_KEY,
      status,
      pagination.pageNum,
      pagination.pageSize,
      appliedFilters.userName,
      appliedFilters.ipaddr,
    ],
    queryFn: () =>
      listLoginLogs({
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize,
        status: status === 'all' ? undefined : status,
        userName: appliedFilters.userName || undefined,
        ipaddr: appliedFilters.ipaddr || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (logQuery.data) {
      setLogs(logQuery.data.list);
      setTotal(logQuery.data.total);
    }
  }, [logQuery.data, setLogs, setTotal]);

  useEffect(() => {
    setRefreshing(logQuery.isFetching);
  }, [logQuery.isFetching, setRefreshing]);

  useEffect(() => {
    const refetch = logQuery.refetch;
    setRefreshHandler(() => {
      void refetch();
    });
    return () => {
      setRefreshHandler(() => {});
    };
  }, [logQuery.refetch, setRefreshHandler]);

  const rows = useMemo(
    () => logQuery.data?.list ?? logs,
    [logQuery.data?.list, logs],
  );

  const handlePageChange = (pageNum: number) => {
    setPagination((prev) => ({ ...prev, pageNum }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination((prev) => ({ ...prev, pageNum: 1, pageSize }));
  };

  return (
    <div className="space-y-4">
      <LoginLogTable
        rows={rows}
        isLoading={logQuery.isLoading && rows.length === 0}
        isError={logQuery.isError && rows.length === 0}
        onDelete={(log) => setDeleteTarget(log)}
      />

      <PaginationToolbar
        currentPage={pagination.pageNum}
        pageSize={pagination.pageSize}
        totalItems={total}
        pageSizeOptions={LOGIN_LOG_PAGE_SIZE_OPTIONS}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        disabled={logQuery.isFetching || isMutating}
      />
    </div>
  );
}
