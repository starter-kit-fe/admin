'use client';

import {
  useNoticeManagementMutationCounter,
  useNoticeManagementRefresh,
  useNoticeManagementSetRefreshHandler,
  useNoticeManagementSetRefreshing,
  useNoticeManagementStore,
} from '@/app/dashboard/system/notice/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { listNotices } from '../api';
import { BASE_NOTICE_QUERY_KEY } from '../constants';
import type { Notice } from '../type';
import { resolveErrorMessage } from '../utils';

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
  const refresh = useNoticeManagementRefresh();
  const { beginMutation, endMutation } = useNoticeManagementMutationCounter();
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

  return (
    <Card className="border border-border/60  dark:border-border/40">
      <CardContent className="flex flex-col gap-3 p-0">
        {noticeQuery.isLoading && notices.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-sm text-muted-foreground">
            公告加载中...
          </div>
        ) : notices.length === 0 ? (
          <Empty className="m-4 h-40 border border-dashed border-border/60">
            <EmptyHeader>
              <EmptyTitle>暂无公告记录</EmptyTitle>
              <EmptyDescription>发布公告后即可在此查看与管理。</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          notices.map((item) => (
            <article
              key={item.noticeId}
              className="flex flex-col gap-3 border-b border-border/60 px-5 py-4 last:border-b-0"
            >
              <header className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-foreground">
                    {item.noticeTitle}
                  </h2>
                  <Badge
                    variant={item.noticeType === '2' ? 'secondary' : 'outline'}
                  >
                    {item.noticeType === '2' ? '公告' : '通知'}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      item.status === '0'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                        : 'border-rose-500/30 bg-rose-500/10 text-rose-600'
                    }
                  >
                    {item.status === '0' ? '正常' : '停用'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit2 className="size-3.5" />
                    编辑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs text-destructive hover:text-destructive"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 className="size-3.5" />
                    删除
                  </Button>
                </div>
              </header>
              <p className="text-sm text-muted-foreground">
                {item.noticeContent}
              </p>
              {item.remark ? (
                <p className="text-xs text-muted-foreground">
                  备注：{item.remark}
                </p>
              ) : null}
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}
