'use client';

import { ManagementHeader } from '@/components/dashboard/management-header';
import { PermissionButton } from '@/components/permission-button';
import { Spinner } from '@/components/ui/spinner';
import { Plus, RefreshCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  useUserManagementRefresh,
  useUserManagementStatus,
  useUserManagementStore,
} from '../../store';

export function UserManagementHeader() {
  const t = useTranslations('UserManagement');
  const { openCreate } = useUserManagementStore();
  const { isRefreshing, isMutating } = useUserManagementStatus();
  const refresh = useUserManagementRefresh();
  const refreshDisabled = isMutating || isRefreshing;

  return (
    <ManagementHeader
      title={t('header.title')}
      description={t('header.description')}
      actions={
        <>
          <PermissionButton
            required="system:user:list"
            variant="outline"
            onClick={() => refresh()}
            disabled={refreshDisabled}
            className="flex items-center"
          >
            {isRefreshing ? <Spinner className="size-4" /> : <RefreshCcw className=" size-4" />}
            {t('header.refresh')}
          </PermissionButton>
          <PermissionButton required="system:user:add" onClick={() => openCreate()} disabled={isMutating}>
            <Plus className="size-4 " />
            {t('header.create')}
          </PermissionButton>
        </>
      }
    />
  );
}
