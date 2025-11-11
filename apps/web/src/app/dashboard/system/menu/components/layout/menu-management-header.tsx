'use client';

import { ManagementHeader } from '@/components/dashboard/management-header';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Plus, RefreshCcw } from 'lucide-react';

import {
  useMenuManagementRefresh,
  useMenuManagementStatus,
  useMenuManagementStore,
} from '@/app/dashboard/system/menu/store';

export function MenuManagementHeader() {
  const { openCreate } = useMenuManagementStore();
  const { isRefreshing, isMutating } = useMenuManagementStatus();
  const refresh = useMenuManagementRefresh();
  const refreshDisabled = isMutating || isRefreshing;

  const actions = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => refresh()}
        disabled={refreshDisabled}
        className="flex items-center gap-2"
      >
        {isRefreshing ? <Spinner className="size-4" /> : <RefreshCcw className="size-4" />}
        刷新
      </Button>
      <Button
        type="button"
        onClick={() => openCreate(0)}
        disabled={isMutating}
        className="flex items-center gap-2"
      >
        <Plus className="size-4" />
        新增目录/菜单
      </Button>
    </>
  );

  return (
    <ManagementHeader
      title="菜单管理"
      description="维护系统导航结构，支持新增、编辑及拖拽排序。"
      actions={actions}
    />
  );
}
