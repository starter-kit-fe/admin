'use client';

import { PermissionButton } from '@/components/permission-button';
import { Spinner } from '@/components/ui/spinner';
import { Plus, RefreshCcw } from 'lucide-react';

import {
  usePostManagementRefresh,
  usePostManagementStatus,
  usePostManagementStore,
} from '@/app/dashboard/system/post/store';

export function PostManagementHeader() {
  const { openCreate } = usePostManagementStore();
  const { isRefreshing, isMutating } = usePostManagementStatus();
  const refresh = usePostManagementRefresh();
  const refreshDisabled = isRefreshing || isMutating;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">岗位管理</h1>
        <p className="text-sm text-muted-foreground">
          通过状态筛选、批量操作和弹窗编辑维护系统岗位。
        </p>
      </div>
      <div className="flex items-center gap-2">
        <PermissionButton
          required="system:post:list"
          variant="outline"
          onClick={() => refresh()}
          disabled={refreshDisabled}
        >
          {isRefreshing ? (
            <Spinner className="mr-2 size-4" />
          ) : (
            <RefreshCcw className="mr-2 size-4" />
          )}
          刷新
        </PermissionButton>
        <PermissionButton
          required="system:post:add"
          onClick={() => openCreate()}
          disabled={isMutating}
        >
          <Plus className="mr-2 size-4" />
          新增岗位
        </PermissionButton>
      </div>
    </div>
  );
}
