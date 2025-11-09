'use client';

import { Ban, RefreshCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

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

  const selectedCount = selectedUsers.length;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">在线用户</h1>
        <p className="text-sm text-muted-foreground">
          实时查看活跃会话，支持按账号、IP 和活跃时间筛选。
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
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
      </div>
    </div>
  );
}
