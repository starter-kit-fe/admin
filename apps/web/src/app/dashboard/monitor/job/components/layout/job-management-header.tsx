'use client';

import {
  useJobManagementRefresh,
  useJobManagementStatus,
  useJobManagementStore,
} from '../../store';
import { ManagementHeader } from '@/components/dashboard/management-header';
import { PermissionButton } from '@/components/permission-button';
import { Spinner } from '@/components/ui/spinner';
import { Plus, RefreshCw } from 'lucide-react';

export function JobManagementHeader() {
  const refresh = useJobManagementRefresh();
  const { isRefreshing, isMutating } = useJobManagementStatus();
  const refreshDisabled = isRefreshing || isMutating;
  const { openCreateEditor } = useJobManagementStore();

  return (
    <ManagementHeader
      title="定时任务"
      description="查看并管理调度任务，支持按名称、分组与状态筛选。"
      actions={
        <div className="flex gap-2">
          <PermissionButton
            required="monitor:job:add"
            type="button"
            onClick={() => openCreateEditor()}
          >
            <Plus className="size-4" />
            新增任务
          </PermissionButton>
          <PermissionButton
            required="monitor:job:list"
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
        </div>
      }
    />
  );
}
