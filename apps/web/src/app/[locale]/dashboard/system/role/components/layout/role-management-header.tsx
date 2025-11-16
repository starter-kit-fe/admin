'use client';

import { useRoleManagementRefresh, useRoleManagementStatus, useRoleManagementStore } from '@/app/dashboard/system/role/store';
import { ManagementHeader } from '@/components/dashboard/management-header';
import { PermissionButton } from '@/components/permission-button';
import { Spinner } from '@/components/ui/spinner';
import { RefreshCw, ShieldPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function RoleManagementHeader() {
  const t = useTranslations('RoleManagement.header');
  const { openCreate } = useRoleManagementStore();
  const { isRefreshing, isMutating } = useRoleManagementStatus();
  const refresh = useRoleManagementRefresh();
  const refreshDisabled = isRefreshing || isMutating;

  return (
    <ManagementHeader
      title={t('title')}
      description={t('description')}
      actions={
        <>
          <PermissionButton
            required="system:role:list"
            type="button"
            variant="outline"
            onClick={() => refresh()}
            disabled={refreshDisabled}
          >
            {isRefreshing ? <Spinner className="size-4" /> : <RefreshCw className="size-4" />}
            {t('refresh')}
          </PermissionButton>
          <PermissionButton
            required="system:role:add"
            type="button"
            onClick={() => openCreate()}
            disabled={isMutating}
          >
            <ShieldPlus className="size-4" />
            {t('create')}
          </PermissionButton>
        </>
      }
    />
  );
}
