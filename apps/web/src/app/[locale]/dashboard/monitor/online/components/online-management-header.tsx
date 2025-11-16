'use client';

import { Ban, RefreshCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ManagementHeader } from '@/components/dashboard/management-header';
import { PermissionButton } from '@/components/permission-button';
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
  const t = useTranslations('OnlineUserManagement.header');

  const selectedCount = selectedUsers.length;

  return (
    <ManagementHeader
      title={t('title')}
      description={t('description')}
      actions={
        <>
          <PermissionButton
            required="monitor:online:batchLogout"
            variant="destructive"
            onClick={() => setBatchDialogOpen(true)}
            disabled={selectedCount === 0 || isMutating}
          >
            {isMutating && selectedCount > 0 ? (
              <>
                <Spinner className="mr-2 size-4" />
                {t('actions.batchPending')}
              </>
            ) : (
              <>
                <Ban className="mr-2 size-4" />
                {t('actions.batch')}
              </>
            )}
          </PermissionButton>
          <PermissionButton
            required="monitor:online:list"
            variant="outline"
            onClick={() => refresh()}
            disabled={isRefreshing || isMutating}
          >
            {isRefreshing ? (
              <>
                <Spinner className="mr-2 size-4" />
                {t('actions.refreshing')}
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 size-4" />
                {t('actions.refresh')}
              </>
            )}
          </PermissionButton>
        </>
      }
    />
  );
}
