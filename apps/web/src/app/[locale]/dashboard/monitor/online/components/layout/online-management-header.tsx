'use client';

import { RefreshCcw } from 'lucide-react';

import { ManagementHeader } from '@/components/dashboard/management-header';
import { PermissionButton } from '@/components/permission-button';
import { Spinner } from '@/components/ui/spinner';
import { useTranslations } from 'next-intl';

import {
  useOnlineUserManagementRefresh,
  useOnlineUserManagementStatus,
} from '../../store';

export function OnlineUserManagementHeader() {
  const t = useTranslations('OnlineUserManagement');
  const { isRefreshing, isMutating } = useOnlineUserManagementStatus();
  const refresh = useOnlineUserManagementRefresh();

  return (
    <ManagementHeader
      title={t('header.title')}
      description={t('header.description')}
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
                {t('header.actions.refreshing')}
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 size-4" />
                {t('header.actions.refresh')}
              </>
            )}
          </PermissionButton>
        </>
      }
    />
  );
}
