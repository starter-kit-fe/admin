'use client';

import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { RowSelectionState } from '@tanstack/react-table';

import { PaginationToolbar } from '@/components/pagination/pagination-toolbar';
import { CardContent } from '@/components/ui/card';

import {
  listOnlineUsers,
  type OnlineUserListParams,
} from '../api';
import {
  ONLINE_USERS_QUERY_KEY,
  PAGE_SIZE_OPTIONS,
} from '../constants';
import {
  useOnlineUserManagementSelectionRevision,
  useOnlineUserManagementSetRefreshHandler,
  useOnlineUserManagementSetRefreshing,
  useOnlineUserManagementStatus,
  useOnlineUserManagementStore,
} from '../store';
import {
  getOnlineUserRowId,
  normalizeOnlineUserResponse,
  resolveSinceValue,
} from '../utils';
import { OnlineUserTable } from './online-user-table';

export function OnlineUserDataSection() {
  const {
    appliedFilters,
    pagination,
    setPagination,
    selectedUsers,
    setSelectedUsers,
    clearSelectedUsers,
    openForceDialog,
    pendingForceRowId,
  } = useOnlineUserManagementStore();
  const selectionRevision = useOnlineUserManagementSelectionRevision();
  const setRefreshing = useOnlineUserManagementSetRefreshing();
  const setRefreshHandler = useOnlineUserManagementSetRefreshHandler();
  const { isMutating } = useOnlineUserManagementStatus();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const queryParams = useMemo(() => {
    const params: OnlineUserListParams = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
    };
    const trimmedUserName = appliedFilters.userName.trim();
    if (trimmedUserName) {
      params.userName = trimmedUserName;
    }
    const trimmedIp = appliedFilters.ipaddr.trim();
    if (trimmedIp) {
      params.ipaddr = trimmedIp;
    }
    const since = resolveSinceValue(appliedFilters.timeRange);
    if (since) {
      params.since = since;
    }
    return params;
  }, [
    appliedFilters.ipaddr,
    appliedFilters.timeRange,
    appliedFilters.userName,
    pagination.pageNum,
    pagination.pageSize,
  ]);

  const query = useQuery({
    queryKey: [...ONLINE_USERS_QUERY_KEY, queryParams],
    queryFn: () => listOnlineUsers(queryParams),
    placeholderData: keepPreviousData,
  });

  const { rows, total } = useMemo(
    () => normalizeOnlineUserResponse(query.data, pagination),
    [pagination, query.data],
  );

  const isLoading = query.isLoading && rows.length === 0;
  const isError = query.isError;

  useEffect(() => {
    setRefreshing(query.isFetching);
  }, [query.isFetching, setRefreshing]);

  useEffect(() => {
    const refetch = query.refetch;
    setRefreshHandler(() => {
      void refetch();
    });
    return () => {
      setRefreshHandler(() => {});
    };
  }, [query.refetch, setRefreshHandler]);

  useEffect(() => {
    const nextSelected = rows.filter((row) =>
      rowSelection[getOnlineUserRowId(row)],
    );
    const nextIds = nextSelected.map((user) => getOnlineUserRowId(user));
    const prevIds = selectedUsers.map((user) =>
      getOnlineUserRowId(user),
    );
    const hasChanged =
      nextIds.length !== prevIds.length ||
      nextIds.some((id, index) => id !== prevIds[index]);
    if (hasChanged) {
      setSelectedUsers(nextSelected);
    }
  }, [rowSelection, rows, selectedUsers, setSelectedUsers]);

  useEffect(() => {
    setRowSelection({});
  }, [selectionRevision]);

  useEffect(() => {
    clearSelectedUsers();
  }, [
    appliedFilters.ipaddr,
    appliedFilters.timeRange,
    appliedFilters.userName,
    clearSelectedUsers,
  ]);

  const handlePageChange = (nextPage: number) => {
    setPagination((prev) => ({ ...prev, pageNum: nextPage }));
    clearSelectedUsers();
  };

  const handlePageSizeChange = (nextSize: number) => {
    setPagination((prev) => ({ ...prev, pageNum: 1, pageSize: nextSize }));
    clearSelectedUsers();
  };

  const shouldShowPagination = !isLoading && !isError && total > 0;

  return (
    <CardContent className="space-y-4">
      <OnlineUserTable
        rows={rows}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        onForceLogout={(user) => openForceDialog(user)}
        pendingForceRowId={pendingForceRowId}
        isForceMutating={Boolean(pendingForceRowId)}
        isLoading={isLoading}
        isError={isError}
      />
      {shouldShowPagination ? (
        <PaginationToolbar
          totalItems={total}
          currentPage={pagination.pageNum}
          pageSize={pagination.pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          disabled={query.isFetching || isMutating}
        />
      ) : null}
    </CardContent>
  );
}
