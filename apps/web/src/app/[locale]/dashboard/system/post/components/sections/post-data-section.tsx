'use client';

import {
  type StatusValue,
  usePostManagementSetRefreshHandler,
  usePostManagementSetRefreshing,
  usePostManagementStatus,
  usePostManagementStore,
} from '@/app/dashboard/system/post/store';
import { PaginationToolbar } from '@/components/pagination/pagination-toolbar';
import { SelectionBanner } from '@/components/selection-banner';
import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';

import { listPosts } from '../../api';
import {
  BASE_QUERY_KEY,
  DEFAULT_PAGINATION,
  PAGE_SIZE_OPTIONS,
  STATUS_TABS,
} from '../../constants';
import type { Post, PostListResponse } from '../../type';
import { PostTable } from '../list/post-table';
import { useTranslations } from 'next-intl';

export function PostDataSection() {
  const t = useTranslations('PostManagement');
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
    posts,
    setPosts,
    total,
    setTotal,
    openEdit,
    setDeleteTarget,
    setBulkDeleteOpen,
  } = usePostManagementStore();
  const { isMutating } = usePostManagementStatus();
  const setRefreshing = usePostManagementSetRefreshing();
  const setRefreshHandler = usePostManagementSetRefreshHandler();

  const postListQuery = useQuery({
    queryKey: [
      ...BASE_QUERY_KEY,
      status,
      appliedFilters.postName,
      pagination.pageNum,
      pagination.pageSize,
    ],
    queryFn: () =>
      listPosts({
        status: status === 'all' ? undefined : status,
        postName: appliedFilters.postName || undefined,
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize,
      }),
    placeholderData: keepPreviousData,
  });

  const statusCountQueries = useQueries({
    queries: STATUS_TABS.map((tab) => ({
      queryKey: [
        'system',
        'posts',
        'count',
        tab.value,
        appliedFilters.postName,
      ],
      queryFn: () =>
        listPosts({
          pageNum: 1,
          pageSize: 1,
          status: tab.value === 'all' ? undefined : tab.value,
          postName: appliedFilters.postName || undefined,
        }),
      select: (data: PostListResponse) => data.total,
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
    setRefreshing(postListQuery.isFetching);
  }, [postListQuery.isFetching, setRefreshing]);

  useEffect(() => {
    const listRefetch = postListQuery.refetch;
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
  }, [postListQuery.refetch, setRefreshHandler, statusCountQueries]);

  useEffect(() => {
    if (postListQuery.data) {
      setPosts(postListQuery.data.list);
      setTotal(postListQuery.data.total);
    }
  }, [postListQuery.data, setPosts, setTotal]);

  const rows = useMemo(() => posts, [posts]);
  const rowsTotal = total;

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set<number>();
      rows.forEach((post) => {
        if (prev.has(post.postId)) {
          next.add(post.postId);
        }
      });
      return next;
    });
  }, [rows, setSelectedIds]);

  const selectedCount = selectedIds.size;
  const isAllSelected =
    rows.length > 0 && rows.every((row) => selectedIds.has(row.postId));
  const headerCheckboxState = isAllSelected
    ? true
    : selectedCount > 0
      ? ('indeterminate' as const)
      : false;

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(rows.map((row) => row.postId)));
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

  const handleBulkDelete = () => {
    if (selectedCount === 0) {
      toast.info(t('toast.bulkDeleteEmpty'));
      return;
    }
    setBulkDeleteOpen(true);
  };

  const handleDelete = (post: Post) => {
    setDeleteTarget(post);
  };

  const handleEdit = (post: Post) => {
    openEdit(post);
  };

  return (
    <div className="flex flex-col gap-4">
      <SelectionBanner
        count={selectedCount}
        onClear={() => clearSelectedIds()}
        onBulkDelete={handleBulkDelete}
      />

      <section className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card  dark:border-border/40">
        <div className="flex-1 overflow-x-auto">
          <PostTable
            rows={rows}
            headerCheckboxState={headerCheckboxState}
            onToggleSelectAll={handleToggleSelectAll}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelectRow}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={postListQuery.isLoading}
            isError={postListQuery.isError}
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
        disabled={postListQuery.isFetching || isMutating}
      />
    </div>
  );
}
