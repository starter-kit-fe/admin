'use client';

import { ManagementHeader } from '@/components/dashboard/management-header';
import { PermissionButton } from '@/components/permission-button';
import { Spinner } from '@/components/ui/spinner';
import { RefreshCcw } from 'lucide-react';

import {
  useLoginLogManagementRefresh,
  useLoginLogManagementStatus,
  useLoginLogManagementStore,
} from '../../store';

export function LoginLogManagementHeader() {
  const { total } = useLoginLogManagementStore();
  const { isRefreshing, isMutating } = useLoginLogManagementStatus();
  const refresh = useLoginLogManagementRefresh();
  const refreshDisabled = isRefreshing || isMutating;

  return (
    <ManagementHeader
      title="登录日志"
      description={`查看与排查后台登录记录，支持按账号、IP 与状态筛选，共 ${total} 条。`}
      actions={
        <PermissionButton
          required="monitor:logininfor:list"
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => refresh()}
          disabled={refreshDisabled}
        >
          {isRefreshing ? (
            <Spinner className="size-4" />
          ) : (
            <RefreshCcw className="size-4" />
          )}
          刷新
        </PermissionButton>
      }
    />
  );
}
