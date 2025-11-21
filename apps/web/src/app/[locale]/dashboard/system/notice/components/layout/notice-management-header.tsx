'use client';

import { ManagementHeader } from '@/components/dashboard/management-header';
import { PermissionButton } from '@/components/permission-button';
import { Spinner } from '@/components/ui/spinner';
import { Megaphone, RefreshCw, Trash2 } from 'lucide-react';

import {
  useNoticeManagementRefresh,
  useNoticeManagementStatus,
  useNoticeManagementStore,
} from '@/app/dashboard/system/notice/store';

export function NoticeManagementHeader() {
  const { notices, openCreate, selectedIds, setBulkDeleteOpen } =
    useNoticeManagementStore();
  const { isRefreshing, isMutating } = useNoticeManagementStatus();
  const refresh = useNoticeManagementRefresh();
  const refreshDisabled = isRefreshing || isMutating;
  const selectedCount = selectedIds.size;

  return (
    <section className="flex flex-col gap-2">
      <ManagementHeader
        title="通知公告"
        description="管理系统通知与公告内容，可快速筛选、创建与下线。"
        actions={
          <>
            <PermissionButton
              required="system:notice:remove"
              type="button"
              variant="outline"
              className="relative"
              onClick={() => setBulkDeleteOpen(true)}
              disabled={selectedCount === 0 || isMutating}
            >
              <Trash2 className="size-4" />
              批量删除
              {selectedCount > 0 ? (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({selectedCount})
                </span>
              ) : null}
            </PermissionButton>
            <PermissionButton
              required="system:notice:list"
              type="button"
              variant="outline"
              onClick={() => refresh()}
              disabled={refreshDisabled}
            >
              {isRefreshing ? (
                <Spinner className="size-4" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              刷新
            </PermissionButton>
            <PermissionButton
              required="system:notice:add"
              type="button"
              onClick={() => openCreate()}
              disabled={isMutating}
            >
              <Megaphone className="size-4" />
              新建公告
            </PermissionButton>
          </>
        }
      />
      <p className="text-xs text-muted-foreground">
        当前共 {notices.length} 条记录，已选择 {selectedCount} 条。
      </p>
    </section>
  );
}
