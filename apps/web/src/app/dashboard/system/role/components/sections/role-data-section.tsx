'use client';

import {
  useRoleManagementSetRefreshHandler,
  useRoleManagementSetRefreshing,
  useRoleManagementStatus,
  useRoleManagementStore,
} from '@/app/dashboard/system/role/store';
import { PaginationToolbar } from '@/components/pagination/pagination-toolbar';
import { SelectionBanner } from '@/components/selection-banner';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';

import { listRoles } from '../../api';
import {
  BASE_QUERY_KEY,
  DEFAULT_PAGINATION,
  PAGE_SIZE_OPTIONS,
} from '../../constants';
import type { Role } from '../../type';
import { RoleTable } from '../list/role-table';

export function RoleDataSection() {
  const {
    status,
    appliedFilters,
    pagination,
    setPagination,
    selectedIds,
    setSelectedIds,
    clearSelectedIds,
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

  useEffect(() => {
    setRefreshing(roleListQuery.isFetching);
  }, [setRefreshing, roleListQuery.isFetching]);

  useEffect(() => {
    const listRefetch = roleListQuery.refetch;
    setRefreshHandler(() => {
      void listRefetch();
    });
    return () => {
      setRefreshHandler(() => {});
    };
  }, [setRefreshHandler, roleListQuery.refetch]);

  const rows = useMemo(
    () => roleListQuery.data?.list ?? [],
    [roleListQuery.data?.list],
  );

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set<number>();
      rows.forEach((role) => {
        if (prev.has(role.id)) {
          next.add(role.id);
        }
      });
      return next;
    });
  }, [rows, setSelectedIds]);

  const selectedCount = selectedIds.size;
  const isAllSelected =
    rows.length > 0 && rows.every((row) => selectedIds.has(row.id));
  const headerCheckboxState = isAllSelected
    ? true
    : selectedCount > 0
      ? ('indeterminate' as const)
      : false;

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(rows.map((row) => row.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelectRow = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
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
    openEdit(role.id);
  };

  return (
    <div className="flex flex-col gap-4">
      <SelectionBanner
        count={selectedCount}
        onClear={() => clearSelectedIds()}
        onBulkDelete={handleBulkDelete}
      />

      <section className="flex flex-col overflow-hidden rounded-xl bg-card ">
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
