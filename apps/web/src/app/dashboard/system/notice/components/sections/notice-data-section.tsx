'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  useNoticeManagementSetRefreshHandler,
  useNoticeManagementSetRefreshing,
  useNoticeManagementStore,
} from '@/app/dashboard/system/notice/store';

import { listNotices } from '../../api';
import { BASE_NOTICE_QUERY_KEY } from '../../constants';
import type { Notice } from '../../type';
import { NoticeTable } from '../list/notice-table';

export function NoticeDataSection() {
  const {
    status,
    noticeType,
    appliedFilters,
    notices,
    setNotices,
    openEdit,
    setDeleteTarget,
    selectedIds,
    setSelectedIds,
    clearSelectedIds,
  } = useNoticeManagementStore();
  const setRefreshing = useNoticeManagementSetRefreshing();
  const setRefreshHandler = useNoticeManagementSetRefreshHandler();
  const queryClient = useQueryClient();

  const noticeQuery = useQuery({
    queryKey: [
      ...BASE_NOTICE_QUERY_KEY,
      status,
      noticeType,
      appliedFilters.noticeTitle,
    ],
    queryFn: () =>
      listNotices({
        status: status === 'all' ? undefined : status,
        noticeType: noticeType === 'all' ? undefined : noticeType,
        noticeTitle: appliedFilters.noticeTitle || undefined,
      }),
  });

  useEffect(() => {
    if (noticeQuery.data) {
      setNotices(noticeQuery.data);
    } else if (!noticeQuery.isLoading) {
      setNotices([]);
    }
  }, [noticeQuery.data, noticeQuery.isLoading, setNotices]);

  useEffect(() => {
    const validIds = new Set(notices.map((notice) => notice.noticeId));
    if (validIds.size === 0) {
      clearSelectedIds();
      return;
    }
    setSelectedIds((prev) => {
      let hasChanges = false;
      prev.forEach((id) => {
        if (!validIds.has(id)) {
          hasChanges = true;
        }
      });
      if (!hasChanges) {
        return prev;
      }
      const next = new Set<number>();
      prev.forEach((id) => {
        if (validIds.has(id)) {
          next.add(id);
        }
      });
      return next;
    });
  }, [clearSelectedIds, notices, setSelectedIds]);

  useEffect(() => {
    setRefreshing(noticeQuery.isFetching);
  }, [noticeQuery.isFetching, setRefreshing]);

  useEffect(() => {
    setRefreshHandler(() => {
      void queryClient.invalidateQueries({ queryKey: BASE_NOTICE_QUERY_KEY });
    });
    return () => {
      setRefreshHandler(() => {});
    };
  }, [queryClient, setRefreshHandler]);

  const handleEdit = (notice: Notice) => {
    openEdit(notice);
  };

  const handleDelete = (notice: Notice) => {
    setDeleteTarget(notice);
  };

  const initialLoading = noticeQuery.isLoading && notices.length === 0;

  const totalRecords = notices.length;
  const selectedCount = selectedIds.size;
  const headerCheckboxState =
    totalRecords === 0
      ? false
      : selectedCount === totalRecords
        ? true
        : selectedCount > 0
          ? 'indeterminate'
          : false;

  const handleToggleSelectAll = (checked: boolean) => {
    if (!checked) {
      clearSelectedIds();
      return;
    }
    const next = new Set<number>(notices.map((notice) => notice.noticeId));
    setSelectedIds(next);
  };

  const handleToggleSelect = (noticeId: number, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        prev.add(noticeId);
      } else {
        prev.delete(noticeId);
      }
      return prev;
    });
  };

  return (
    <NoticeTable
      records={notices}
      loading={initialLoading}
      isError={noticeQuery.isError}
      headerCheckboxState={headerCheckboxState}
      onToggleSelectAll={handleToggleSelectAll}
      selectedIds={selectedIds}
      onToggleSelect={handleToggleSelect}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}
