'use client';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Plus, RefreshCcw } from 'lucide-react';

import {
  useUserManagementRefresh,
  useUserManagementStatus,
  useUserManagementStore,
} from '../store';

export function UserManagementHeader() {
  const { openCreate } = useUserManagementStore();
  const { isRefreshing, isMutating } = useUserManagementStatus();
  const refresh = useUserManagementRefresh();
  const refreshDisabled = isMutating || isRefreshing;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">用户管理</h1>
        <p className="text-sm text-muted-foreground">
          通过状态筛选、批量操作和响应式弹窗管理系统用户。
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => refresh()}
          disabled={refreshDisabled}
          className="flex items-center"
        >
          {isRefreshing ? (
            <Spinner className="mr-2 size-4" />
          ) : (
            <RefreshCcw className="mr-2 size-4" />
          )}
          刷新
        </Button>
        <Button onClick={() => openCreate()} disabled={isMutating}>
          <Plus className="mr-2 size-4" />
          新增用户
        </Button>
      </div>
    </div>
  );
}
