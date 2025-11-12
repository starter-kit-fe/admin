'use client';

import { useJobManagementRefresh, useJobManagementStatus } from '../../store';
import { ManagementHeader } from '@/components/dashboard/management-header';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { RefreshCw } from 'lucide-react';

export function JobManagementHeader() {
  const refresh = useJobManagementRefresh();
  const { isRefreshing, isMutating } = useJobManagementStatus();
  const refreshDisabled = isRefreshing || isMutating;

  return (
    <ManagementHeader
      title="定时任务"
      description="查看并管理调度任务，支持按名称、分组与状态筛选。"
      actions={
        <Button
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
        </Button>
      }
    />
  );
}
