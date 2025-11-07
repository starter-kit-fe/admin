'use client';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Plus, RefreshCcw } from 'lucide-react';

import {
  useNoticeManagementRefresh,
  useNoticeManagementStatus,
  useNoticeManagementStore,
} from '@/app/dashboard/system/notice/store';

export function NoticeManagementHeader() {
  const { notices, openCreate } = useNoticeManagementStore();
  const { isRefreshing, isMutating } = useNoticeManagementStatus();
  const refresh = useNoticeManagementRefresh();
  const refreshDisabled = isRefreshing || isMutating;

  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">通知公告</h1>
        <p className="text-sm text-muted-foreground">
          管理系统通知与公告内容，可快速筛选、创建与下线。
        </p>
        <p className="text-xs text-muted-foreground">
          当前共 {notices.length} 条记录。
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => refresh()}
          disabled={refreshDisabled}
          className="flex items-center gap-2"
        >
          {isRefreshing ? (
            <Spinner className="size-4" />
          ) : (
            <RefreshCcw className="size-4" />
          )}
          刷新
        </Button>
        <Button
          type="button"
          onClick={() => openCreate()}
          disabled={isMutating}
          className="flex items-center gap-2"
        >
          <Plus className="size-4" />
          新建公告
        </Button>
      </div>
    </section>
  );
}
