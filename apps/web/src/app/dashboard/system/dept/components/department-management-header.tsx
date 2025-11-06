'use client';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Plus, RefreshCcw } from 'lucide-react';

import {
  useDepartmentManagementRefresh,
  useDepartmentManagementStatus,
  useDepartmentManagementStore,
} from '@/app/dashboard/system/dept/store';

export function DepartmentManagementHeader() {
  const { openCreate } = useDepartmentManagementStore();
  const { isRefreshing, isMutating } = useDepartmentManagementStatus();
  const refresh = useDepartmentManagementRefresh();
  const refreshDisabled = isRefreshing || isMutating;

  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">部门管理</h1>
        <p className="text-sm text-muted-foreground">
          统一在顶部查看说明，快速掌握组织层级与维护准则。
        </p>
        <p className="text-sm text-muted-foreground">
          使用下方筛选定位部门，并配合树视图完成新增或调整。
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
          onClick={() => openCreate(0)}
          disabled={isMutating}
          className="flex items-center gap-2"
        >
          <Plus className="size-4" />
          新增部门
        </Button>
      </div>
    </section>
  );
}
