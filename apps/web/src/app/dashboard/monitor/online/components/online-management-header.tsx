'use client';

import { Ban, RefreshCcw } from 'lucide-react';

import { ManagementHeader } from '@/components/dashboard/management-header';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import { useOnlinePermissionFlags } from '../hooks';
import {
  useOnlineUserManagementRefresh,
  useOnlineUserManagementStatus,
  useOnlineUserManagementStore,
} from '../store';

export function OnlineUserManagementHeader() {
  const { selectedUsers, setBatchDialogOpen } =
    useOnlineUserManagementStore();
  const { isRefreshing, isMutating } = useOnlineUserManagementStatus();
  const refresh = useOnlineUserManagementRefresh();
  const { canList, canBatchLogout } = useOnlinePermissionFlags();

  const selectedCount = selectedUsers.length;

  return (
    <ManagementHeader
      title="在线用户"
      description="实时查看活跃会话，支持按账号、IP 和活跃时间筛选。"
      actions={
        <>
          {canBatchLogout ? (
            <Button
              variant="destructive"
              onClick={() => setBatchDialogOpen(true)}
              disabled={selectedCount === 0 || isMutating}
            >
              {isMutating && selectedCount > 0 ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  强退中
                </>
              ) : (
                <>
                  <Ban className="mr-2 size-4" />
                  批量强退
                </>
              )}
            </Button>
          ) : null}
          {canList ? (
            <Button
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
            </Button>
          ) : null}
        </>
      }
    />
  );
}
