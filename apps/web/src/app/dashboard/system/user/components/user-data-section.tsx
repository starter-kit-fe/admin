'use client';

import { useEffect, useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { PaginationToolbar } from '@/components/pagination/pagination-toolbar';
import { SelectionBanner } from '@/components/selection-banner';

import { listUsers } from '../api';
import { DEFAULT_PAGINATION, PAGE_SIZE_OPTIONS, STATUS_TABS } from '../constants';
import {
  useUserManagementSetRefreshHandler,
  useUserManagementSetRefreshing,
  useUserManagementStatus,
  useUserManagementStore,
  type StatusValue,
} from '../store';
import type { User, UserListResponse } from '../type';
import { DEFAULT_ROLE_VALUE, getRoleLabel } from './utils';
import { UserTable } from './user-table';

export function UserDataSection() {
  const {
    status,
    appliedFilters,
    pagination,
    setPagination,
    selectedIds,
    setSelectedIds,
    clearSelectedIds,
    roleOptions,
    setRoleOptions,
    statusCounts,
    setStatusCounts,
    setDeleteTarget,
    openEdit,
    setBulkDeleteOpen,
  } = useUserManagementStore();
  const { isMutating } = useUserManagementStatus();
  const setRefreshing = useUserManagementSetRefreshing();
  const setRefreshHandler = useUserManagementSetRefreshHandler();

  const userListQuery = useQuery({
    queryKey: [
      'system',
      'users',
      'list',
      status,
      appliedFilters.keyword,
      pagination.pageNum,
      pagination.pageSize,
    ],
    queryFn: () =>
      listUsers({
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize,
        status: status === 'all' ? undefined : status,
        userName: appliedFilters.keyword || undefined,
      }),
    keepPreviousData: true,
  });

  const statusCountQueries = useQueries({
    queries: STATUS_TABS.map((tab) => ({
      queryKey: [
        'system',
        'users',
        'count',
        tab.value,
        appliedFilters.keyword,
      ],
      queryFn: () =>
        listUsers({
          pageNum: 1,
          pageSize: 1,
          status: tab.value === 'all' ? undefined : tab.value,
          userName: appliedFilters.keyword || undefined,
        }),
      select: (data: UserListResponse) => data.total,
    })),
  });

  useEffect(() => {
    const counts = STATUS_TABS.reduce<Record<StatusValue, number>>(
      (acc, tab, index) => {
        const value = statusCountQueries[index]?.data ?? 0;
        acc[tab.value as StatusValue] = value;
        return acc;
      },
      { all: 0, '0': 0, '1': 0 },
    );

    const changed = STATUS_TABS.some(
      (tab) => counts[tab.value as StatusValue] !== statusCounts[tab.value as StatusValue],
    );

    if (changed) {
      setStatusCounts(counts);
    }
  }, [setStatusCounts, statusCounts, statusCountQueries]);

  useEffect(() => {
    setRefreshing(userListQuery.isFetching);
  }, [setRefreshing, userListQuery.isFetching]);

  useEffect(() => {
    const refetch = userListQuery.refetch;
    setRefreshHandler(() => {
      void refetch();
    });
    return () => {
      setRefreshHandler(() => {});
    };
  }, [setRefreshHandler, userListQuery.refetch]);

  const rows = useMemo(() => userListQuery.data?.items ?? [], [userListQuery.data?.items]);

  const computedRoleOptions = useMemo(() => {
    const labels = new Set<string>();
    rows.forEach((user) => {
      const roleLabel = getRoleLabel(user);
      if (roleLabel) {
        labels.add(roleLabel);
      }
    });
    return [
      { label: '全部角色', value: DEFAULT_ROLE_VALUE },
      ...Array.from(labels).map((label) => ({ label, value: label })),
    ];
  }, [rows]);

  useEffect(() => {
    const sameLength = roleOptions.length === computedRoleOptions.length;
    const isSame =
      sameLength &&
      roleOptions.every(
        (option, index) =>
          option.value === computedRoleOptions[index]?.value &&
          option.label === computedRoleOptions[index]?.label,
      );
    if (!isSame) {
      setRoleOptions(computedRoleOptions);
    }
  }, [computedRoleOptions, roleOptions, setRoleOptions]);

  const filteredRows = useMemo(() => {
    if (appliedFilters.role === DEFAULT_ROLE_VALUE) {
      return rows;
    }
    return rows.filter((user) => getRoleLabel(user) === appliedFilters.role);
  }, [appliedFilters.role, rows]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set<number>();
      filteredRows.forEach((user) => {
        if (prev.has(user.userId)) {
          next.add(user.userId);
        }
      });
      return next;
    });
  }, [filteredRows, setSelectedIds]);

  const selectedCount = selectedIds.size;
  const isAllSelected =
    filteredRows.length > 0 &&
    filteredRows.every((row) => selectedIds.has(row.userId));
  const headerCheckboxState = isAllSelected
    ? true
    : selectedCount > 0
      ? ('indeterminate' as const)
      : false;

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredRows.map((row) => row.userId)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelectRow = (userId: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  };

  const handlePageChange = (pageNum: number) => {
    setPagination((prev) => ({ ...prev, pageNum }));
    setSelectedIds(new Set());
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination({ pageNum: DEFAULT_PAGINATION.pageNum, pageSize });
    setSelectedIds(new Set());
  };

  const handleResetPassword = (user: User) => {
    void user;
    toast.info('重置密码功能暂未开放，敬请期待。');
  };

  const total = userListQuery.data?.total ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <SelectionBanner
        count={selectedCount}
        onClear={() => clearSelectedIds()}
        onBulkDelete={() => {
          if (selectedCount > 0) {
            setBulkDeleteOpen(true);
          }
        }}
      />

      <section className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm dark:border-border/40">
        <div className="flex-1 overflow-x-auto">
          <UserTable
            rows={filteredRows}
            headerCheckboxState={headerCheckboxState}
            onToggleSelectAll={handleToggleSelectAll}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelectRow}
            onEdit={openEdit}
            onResetPassword={handleResetPassword}
            onChangeRole={openEdit}
            onDelete={setDeleteTarget}
            isLoading={userListQuery.isLoading}
            isError={userListQuery.isError}
          />
        </div>
      </section>

      <PaginationToolbar
        totalItems={total}
        currentPage={pagination.pageNum}
        pageSize={pagination.pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        disabled={userListQuery.isFetching || isMutating}
      />
    </div>
  );
}
