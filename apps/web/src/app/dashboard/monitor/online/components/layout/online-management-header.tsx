'use client';

import { RefreshCcw } from 'lucide-react';

import { ManagementHeader } from '@/components/dashboard/management-header';
import { PermissionButton } from '@/components/permission-button';
import { Spinner } from '@/components/ui/spinner';

import {
  useOnlineUserManagementRefresh,
  useOnlineUserManagementStatus,
} from '../../store';

export function OnlineUserManagementHeader() {
  const { isRefreshing, isMutating } = useOnlineUserManagementStatus();
  const refresh = useOnlineUserManagementRefresh();

  return (
    <ManagementHeader
      title="在线用户"
      description="实时查看活跃会话，支持按账号、IP 和活跃时间筛选。"
      actions={
        <>
          <PermissionButton
            required="monitor:online:list"
            variant="outline"
            onClick={() => refresh()}
            disabled={isRefreshing || isMutating}
          >
            {isRefreshing ? (
              <>
                <Spinner className="mr-2 size-4" />
                刷新中
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 size-4" />
                刷新
              </>
            )}
          </PermissionButton>
        </>
      }
    />
  );
}
