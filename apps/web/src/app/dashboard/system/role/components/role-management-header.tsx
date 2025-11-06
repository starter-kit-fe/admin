'use client';

import { RefreshCw, ShieldPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import {
  useRoleManagementRefresh,
  useRoleManagementStatus,
  useRoleManagementStore,
} from '@/app/dashboard/system/role/store';

export function RoleManagementHeader() {
  const { openCreate } = useRoleManagementStore();
  const { isRefreshing, isMutating } = useRoleManagementStatus();
  const refresh = useRoleManagementRefresh();
  const refreshDisabled = isRefreshing || isMutating;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">角色管理</h1>
        <p className="text-sm text-muted-foreground">
          维护系统角色与权限字符，支持解锁批量操作与细粒度数据范围。
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
            <RefreshCw className="size-4" />
          )}
          刷新
        </Button>
        <Button
          type="button"
          onClick={() => openCreate()}
          disabled={isMutating}
          className="flex items-center gap-2"
        >
          <ShieldPlus className="size-4" />
          新建角色
        </Button>
      </div>
    </div>
  );
}
