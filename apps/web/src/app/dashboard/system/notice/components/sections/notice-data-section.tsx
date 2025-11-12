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
import { NoticeList } from '../list/notice-list';

export function NoticeDataSection() {
  const {
    status,
    noticeType,
    appliedFilters,
    notices,
    setNotices,
    openEdit,
    setDeleteTarget,
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

  return (
    <NoticeList
      records={notices}
      loading={initialLoading}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}
