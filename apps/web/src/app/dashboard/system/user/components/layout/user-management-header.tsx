'use client';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Plus, RefreshCcw } from 'lucide-react';
import { ManagementHeader } from '@/components/dashboard/management-header';

import {
  useUserManagementRefresh,
  useUserManagementStatus,
  useUserManagementStore,
} from '../../store';

export function UserManagementHeader() {
  const { openCreate } = useUserManagementStore();
  const { isRefreshing, isMutating } = useUserManagementStatus();
  const refresh = useUserManagementRefresh();
  const refreshDisabled = isMutating || isRefreshing;

  return (
    <ManagementHeader
      title="用户管理"
      description="通过状态筛选、批量操作和响应式弹窗管理系统用户。"
      actions={
        <>
          <Button variant="outline" onClick={() => refresh()} disabled={refreshDisabled} className="flex items-center">
            {isRefreshing ? <Spinner className="size-4" /> : <RefreshCcw className=" size-4" />}
            刷新
          </Button>
          <Button onClick={() => openCreate()} disabled={isMutating}>
            <Plus className="size-4 " />
            新增用户
          </Button>
        </>
      }
    />
  );
}
