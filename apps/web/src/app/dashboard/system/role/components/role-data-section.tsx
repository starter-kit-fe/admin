'use client';

import { useEffect, useMemo } from 'react';
import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { PaginationToolbar } from '@/components/pagination/pagination-toolbar';
import { SelectionBanner } from '@/components/selection-banner';

import { listRoles } from '../api';
import {
  BASE_QUERY_KEY,
  DEFAULT_PAGINATION,
  PAGE_SIZE_OPTIONS,
  STATUS_TABS,
} from '../constants';
import {
  useRoleManagementSetRefreshHandler,
  useRoleManagementSetRefreshing,
  useRoleManagementStatus,
  useRoleManagementStore,
  type StatusValue,
} from '@/app/dashboard/system/role/store';
import type { Role, RoleListResponse } from '../type';
import { RoleTable } from './role-table';

export function RoleDataSection() {
  const {
    status,
    appliedFilters,
    pagination,
    setPagination,
    selectedIds,
    setSelectedIds,
    clearSelectedIds,
    statusCounts,
    setStatusCounts,
    setDeleteTarget,
    openEdit,
    setBulkDeleteOpen,
  } = useRoleManagementStore();
  const { isMutating } = useRoleManagementStatus();
  const setRefreshing = useRoleManagementSetRefreshing();
  const setRefreshHandler = useRoleManagementSetRefreshHandler();

  const roleListQuery = useQuery({
    queryKey: [
      ...BASE_QUERY_KEY,
      status,
      appliedFilters.keyword,
      pagination.pageNum,
      pagination.pageSize,
    ],
    queryFn: () =>
      listRoles({
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize,
        status: status === 'all' ? undefined : status,
        roleName: appliedFilters.keyword || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const statusCountQueries = useQueries({
    queries: STATUS_TABS.map((tab) => ({
      queryKey: [
        'system',
        'roles',
        'count',
        tab.value,
        appliedFilters.keyword,
      ],
      queryFn: () =>
        listRoles({
          pageNum: 1,
          pageSize: 1,
          status: tab.value === 'all' ? undefined : tab.value,
          roleName: appliedFilters.keyword || undefined,
        }),
      select: (data: RoleListResponse) => data.total,
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
      (tab) =>
        counts[tab.value as StatusValue] !==
        statusCounts[tab.value as StatusValue],
    );

    if (changed) {
      setStatusCounts(counts);
    }
  }, [setStatusCounts, statusCounts, statusCountQueries]);

  useEffect(() => {
    setRefreshing(roleListQuery.isFetching);
  }, [setRefreshing, roleListQuery.isFetching]);

  useEffect(() => {
    const listRefetch = roleListQuery.refetch;
    const refetchCounts = () => {
      statusCountQueries.forEach((query) => {
        void query.refetch();
      });
    };
    setRefreshHandler(() => {
      void listRefetch();
      refetchCounts();
    });
    return () => {
      setRefreshHandler(() => {});
    };
  }, [setRefreshHandler, roleListQuery.refetch, statusCountQueries]);

  const rows = useMemo(
    () => roleListQuery.data?.items ?? [],
    [roleListQuery.data?.items],
  );

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set<number>();
      rows.forEach((role) => {
        if (prev.has(role.roleId)) {
          next.add(role.roleId);
        }
      });
      return next;
    });
  }, [rows, setSelectedIds]);

  const selectedCount = selectedIds.size;
  const isAllSelected =
    rows.length > 0 && rows.every((row) => selectedIds.has(row.roleId));
  const headerCheckboxState = isAllSelected
    ? true
    : selectedCount > 0
      ? ('indeterminate' as const)
      : false;

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(rows.map((row) => row.roleId)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelectRow = (roleId: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(roleId);
      } else {
        next.delete(roleId);
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

  const rowsTotal = roleListQuery.data?.total ?? 0;

  const handleBulkDelete = () => {
    if (selectedCount === 0) {
      toast.info('请先选择需要删除的角色');
      return;
    }
    setBulkDeleteOpen(true);
  };

  const handleDelete = (role: Role) => {
    setDeleteTarget(role);
  };

  const handleEdit = (role: Role) => {
    openEdit(role.roleId);
  };

  return (
    <div className="flex flex-col gap-4">
      <SelectionBanner
        count={selectedCount}
        onClear={() => clearSelectedIds()}
        onBulkDelete={handleBulkDelete}
      />

      <section className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm dark:border-border/40">
        <div className="flex-1 overflow-x-auto">
          <RoleTable
            rows={rows}
            headerCheckboxState={headerCheckboxState}
            onToggleSelectAll={handleToggleSelectAll}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelectRow}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={roleListQuery.isLoading}
            isError={roleListQuery.isError}
          />
        </div>
      </section>

      <PaginationToolbar
        totalItems={rowsTotal}
        currentPage={pagination.pageNum}
        pageSize={pagination.pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        disabled={roleListQuery.isFetching || isMutating}
      />
    </div>
  );
}
