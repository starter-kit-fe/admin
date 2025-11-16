'use client';

import { useJobManagementRefresh, useJobManagementStatus } from '../../store';
import { ManagementHeader } from '@/components/dashboard/management-header';
import { PermissionButton } from '@/components/permission-button';
import { Spinner } from '@/components/ui/spinner';
import { RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function JobManagementHeader() {
  const refresh = useJobManagementRefresh();
  const { isRefreshing, isMutating } = useJobManagementStatus();
  const refreshDisabled = isRefreshing || isMutating;
  const tHeader = useTranslations('JobManagement.header');

  return (
    <ManagementHeader
      title={tHeader('title')}
      description={tHeader('description')}
      actions={
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
          {tHeader('refresh')}
        </PermissionButton>
      }
    />
  );
}
