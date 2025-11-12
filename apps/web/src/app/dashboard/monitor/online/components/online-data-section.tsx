'use client';

import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { RowSelectionState } from '@tanstack/react-table';

import { PaginationToolbar } from '@/components/pagination/pagination-toolbar';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';

import {
  listOnlineUsers,
  type OnlineUserListParams,
} from '../api';
import {
  ONLINE_PERMISSION_CODES,
  ONLINE_USERS_QUERY_KEY,
  PAGE_SIZE_OPTIONS,
} from '../constants';
import { useOnlinePermissionFlags } from '../hooks';
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
  const { canList, canForceLogout, canBatchLogout } =
    useOnlinePermissionFlags();
  const selectedUserCount = selectedUsers.length;

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
    enabled: canList,
    placeholderData: keepPreviousData,
  });

  const { rows, total } = useMemo(() => {
    if (!canList) {
      return { rows: [], total: 0 };
    }
    return normalizeOnlineUserResponse(query.data, pagination);
  }, [canList, pagination, query.data]);

  const isLoading = canList && query.isLoading && rows.length === 0;
  const isError = canList && query.isError;

  useEffect(() => {
    if (!canList) {
      setRefreshing(false);
      return;
    }
    setRefreshing(query.isFetching);
  }, [canList, query.isFetching, setRefreshing]);

  useEffect(() => {
    if (!canList) {
      setRefreshHandler(() => {});
      return;
    }
    const refetch = query.refetch;
    setRefreshHandler(() => {
      void refetch();
    });
    return () => {
      setRefreshHandler(() => {});
    };
  }, [canList, query.refetch, setRefreshHandler]);

  useEffect(() => {
    if (!canBatchLogout) {
      return;
    }
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
  }, [
    canBatchLogout,
    rowSelection,
    rows,
    selectedUsers,
    setSelectedUsers,
  ]);

  useEffect(() => {
    if (canBatchLogout) {
      return;
    }
    if (selectedUserCount > 0) {
      clearSelectedUsers();
    }
    setRowSelection({});
  }, [canBatchLogout, clearSelectedUsers, selectedUserCount]);

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

  const shouldShowPagination =
    canList && !isLoading && !isError && total > 0;

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card">
        {canList ? (
          <div className="w-full overflow-x-auto">
            <OnlineUserTable
              rows={rows}
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
              onForceLogout={(user) => openForceDialog(user)}
              pendingForceRowId={pendingForceRowId}
              isForceMutating={Boolean(pendingForceRowId)}
              isLoading={isLoading}
              isError={isError}
              canSelectRows={canBatchLogout}
              canForceLogout={canForceLogout}
            />
          </div>
        ) : (
          <div className="flex h-48 flex-col items-center justify-center px-4 text-center">
            <Empty className="border-0 bg-transparent p-4">
              <EmptyHeader>
                <EmptyTitle>暂无访问权限</EmptyTitle>
                <EmptyDescription>
                  需要 {ONLINE_PERMISSION_CODES.list} 权限才能查看在线用户。
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        )}
      </section>
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
    </div>
  );
}
