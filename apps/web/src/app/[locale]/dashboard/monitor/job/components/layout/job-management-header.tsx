'use client';

import {
  useJobManagementRefresh,
  useJobManagementStatus,
  useJobManagementStore,
} from '../../store';
import { useTranslations } from 'next-intl';
import { ManagementHeader } from '@/components/dashboard/management-header';
import { PermissionButton } from '@/components/permission-button';
import { Spinner } from '@/components/ui/spinner';
import { Plus, RefreshCw } from 'lucide-react';

export function JobManagementHeader() {
  const t = useTranslations('JobManagement');
  const refresh = useJobManagementRefresh();
  const { isRefreshing, isMutating } = useJobManagementStatus();
  const refreshDisabled = isRefreshing || isMutating;
  const { openCreateEditor } = useJobManagementStore();

  return (
    <ManagementHeader
      title={t('header.title')}
      description={t('header.description')}
      actions={
        <div className="flex gap-2">
          <PermissionButton
            required="monitor:job:add"
            type="button"
            onClick={() => openCreateEditor()}
          >
            <Plus className="size-4" />
            {t('header.create')}
          </PermissionButton>
          <PermissionButton
            required="monitor:job:list"
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
            {t('header.refresh')}
          </PermissionButton>
        </div>
      }
    />
  );
}
