'use client';

import { PaginationToolbar } from '@/components/pagination/pagination-toolbar';
import { SelectionBanner } from '@/components/selection-banner';
import { Spinner } from '@/components/ui/spinner';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';
import { useInView } from 'framer-motion';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';

import { listUsers } from '../../api';
import { DEFAULT_PAGINATION, PAGE_SIZE_OPTIONS } from '../../constants';
import {
  useUserManagementSetRefreshHandler,
  useUserManagementSetRefreshing,
  useUserManagementStatus,
  useUserManagementStore,
} from '../../store';
import type { User } from '../../type';
import { UserTable } from '../list/user-table';
import { DEFAULT_ROLE_VALUE, getRoleLabel } from '../utils';

export function UserDataSection() {
  const t = useTranslations('UserManagement');
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
    setDeleteTarget,
    openEdit,
    setBulkDeleteOpen,
    setResetPasswordTarget,
  } = useUserManagementStore();
  const { isMutating } = useUserManagementStatus();
  const setRefreshing = useUserManagementSetRefreshing();
  const setRefreshHandler = useUserManagementSetRefreshHandler();
  const isMobile = useIsMobile();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadMoreInView = useInView(loadMoreRef, {
    margin: '0px 0px -120px 0px',
  });

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
    placeholderData: keepPreviousData,
    enabled: !isMobile,
  });

  const mobileUserListQuery = useInfiniteQuery({
    queryKey: [
      'system',
      'users',
      'list',
      'infinite',
      status,
      appliedFilters.keyword,
      pagination.pageSize,
    ],
    queryFn: ({ pageParam = 1 }) =>
      listUsers({
        pageNum: pageParam,
        pageSize: pagination.pageSize,
        status: status === 'all' ? undefined : status,
        userName: appliedFilters.keyword || undefined,
      }),
    getNextPageParam: (lastPage) => {
      const hasMoreByTotal =
        typeof lastPage.total === 'number'
          ? lastPage.pageNum * lastPage.pageSize < lastPage.total
          : lastPage.list.length === lastPage.pageSize;
      return hasMoreByTotal ? lastPage.pageNum + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: isMobile,
  });
  const {
    data: mobileData,
    fetchNextPage,
    hasNextPage,
    isFetching: mobileIsFetching,
    isFetchingNextPage,
    isLoading: mobileIsLoading,
    isError: mobileIsError,
    refetch: mobileRefetch,
  } = mobileUserListQuery;
  const mobileHasNextPage = hasNextPage ?? false;

  useEffect(() => {
    const next =
      isMobile && !mobileIsLoading
        ? mobileIsFetching && !isFetchingNextPage
        : userListQuery.isFetching;
    setRefreshing(next);
  }, [
    isMobile,
    mobileIsFetching,
    isFetchingNextPage,
    mobileIsLoading,
    setRefreshing,
    userListQuery.isFetching,
  ]);

  useEffect(() => {
    const refetch = isMobile ? mobileRefetch : userListQuery.refetch;
    setRefreshHandler(() => {
      void refetch();
    });
    return () => {
      setRefreshHandler(() => {});
    };
  }, [isMobile, mobileRefetch, setRefreshHandler, userListQuery.refetch]);

  useEffect(() => {
    if (
      !isMobile ||
      !mobileHasNextPage ||
      !loadMoreInView ||
      isFetchingNextPage ||
      mobileIsLoading
    ) {
      return;
    }
    void fetchNextPage();
  }, [
    isMobile,
    loadMoreInView,
    mobileHasNextPage,
    isFetchingNextPage,
    mobileIsLoading,
    fetchNextPage,
  ]);

  const rows = useMemo(() => {
    if (isMobile) {
      return mobileData?.pages.flatMap((page) => page.list) ?? [];
    }
    return userListQuery.data?.list ?? [];
  }, [isMobile, mobileData?.pages, userListQuery.data?.list]);

  const computedRoleOptions = useMemo(() => {
    const labels = new Set<string>();
    rows.forEach((user) => {
      const roleLabel = getRoleLabel(user, t('table.defaultRole'));
      if (roleLabel) {
        labels.add(roleLabel);
      }
    });
    return [
      { label: t('filters.allRoles'), value: DEFAULT_ROLE_VALUE },
      ...Array.from(labels).map((label) => ({ label, value: label })),
    ];
  }, [rows, t]);

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
    return rows.filter(
      (user) => getRoleLabel(user, t('table.defaultRole')) === appliedFilters.role,
    );
  }, [appliedFilters.role, rows, t]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set<number>();
      filteredRows.forEach((user) => {
        if (prev.has(user.id)) {
          next.add(user.id);
        }
      });
      return next;
    });
  }, [filteredRows, setSelectedIds]);

  const selectedCount = selectedIds.size;
  const isAllSelected =
    filteredRows.length > 0 &&
    filteredRows.every((row) => selectedIds.has(row.id));
  const headerCheckboxState = isAllSelected
    ? true
    : selectedCount > 0
      ? ('indeterminate' as const)
      : false;

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredRows.map((row) => row.id)));
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

  const handleResetPassword = (user: User) => {
    setResetPasswordTarget(user);
  };

  const total = isMobile
    ? (mobileData?.pages?.[0]?.total ?? 0)
    : (userListQuery.data?.total ?? 0);
  const listIsLoading = isMobile ? mobileIsLoading : userListQuery.isLoading;
  const listIsError = isMobile ? mobileIsError : userListQuery.isError;

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

      <section className="overflow-hidden rounded-xl border border-border/60 bg-card  dark:border-border/40">
        <div className="flex-1 overflow-x-auto">
          <UserTable
            rows={filteredRows}
            headerCheckboxState={headerCheckboxState}
            onToggleSelectAll={handleToggleSelectAll}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelectRow}
            onEdit={openEdit}
            onResetPassword={handleResetPassword}
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
