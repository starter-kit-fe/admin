'use client';

import { ManagementHeader } from '@/components/dashboard/management-header';
import { PermissionButton } from '@/components/permission-button';
import { Spinner } from '@/components/ui/spinner';
import { Plus, RefreshCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  useMenuManagementRefresh,
  useMenuManagementStatus,
  useMenuManagementStore,
} from '@/app/dashboard/system/menu/store';

export function MenuManagementHeader() {
  const t = useTranslations('MenuManagement.header');
  const { openCreate } = useMenuManagementStore();
  const { isRefreshing, isMutating } = useMenuManagementStatus();
  const refresh = useMenuManagementRefresh();
  const refreshDisabled = isMutating || isRefreshing;

  const actions = (
    <>
      <PermissionButton
        required="system:menu:list"
        type="button"
        variant="outline"
        onClick={() => refresh()}
        disabled={refreshDisabled}
        className="flex items-center gap-2"
      >
        {isRefreshing ? <Spinner className="size-4" /> : <RefreshCcw className="size-4" />}
        {t('refresh')}
      </PermissionButton>
      <PermissionButton
        required="system:menu:add"
        type="button"
        onClick={() => openCreate(0)}
        disabled={isMutating}
        className="flex items-center gap-2"
      >
        <Plus className="size-4" />
        {t('create')}
      </PermissionButton>
    </>
  );

  return (
    <ManagementHeader
      title={t('title')}
      description={t('description')}
      actions={actions}
    />
  );
}
