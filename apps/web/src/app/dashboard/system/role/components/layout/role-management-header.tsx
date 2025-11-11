'use client';

import { useRoleManagementRefresh, useRoleManagementStatus, useRoleManagementStore } from '@/app/dashboard/system/role/store';
import { ManagementHeader } from '@/components/dashboard/management-header';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { RefreshCw, ShieldPlus } from 'lucide-react';

export function RoleManagementHeader() {
  const { openCreate } = useRoleManagementStore();
  const { isRefreshing, isMutating } = useRoleManagementStatus();
  const refresh = useRoleManagementRefresh();
  const refreshDisabled = isRefreshing || isMutating;

  return (
    <ManagementHeader
      title="角色管理"
      description="维护系统角色与权限字符，支持解锁批量操作与细粒度数据范围。"
      actions={
        <>
          <Button type="button" variant="outline" onClick={() => refresh()} disabled={refreshDisabled}>
            {isRefreshing ? <Spinner className="size-4" /> : <RefreshCw className="size-4" />}
            刷新
          </Button>
          <Button type="button" onClick={() => openCreate()} disabled={isMutating}>
            <ShieldPlus className="size-4" />
            新建角色
          </Button>
        </>
      }
    />
  );
}
