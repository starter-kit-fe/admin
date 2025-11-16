'use client';

import { ManagementHeader } from '@/components/dashboard/management-header';
import { PermissionButton } from '@/components/permission-button';
import { Spinner } from '@/components/ui/spinner';
import { RefreshCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  useLoginLogManagementRefresh,
  useLoginLogManagementStatus,
  useLoginLogManagementStore,
} from '../../store';

export function LoginLogManagementHeader() {
  const t = useTranslations('LoginLogManagement.header');
  const { total } = useLoginLogManagementStore();
  const { isRefreshing, isMutating } = useLoginLogManagementStatus();
  const refresh = useLoginLogManagementRefresh();
  const refreshDisabled = isRefreshing || isMutating;

  return (
    <ManagementHeader
      title={t('title')}
      description={t('description', { total })}
      actions={
        <PermissionButton
          required="monitor:logininfor:list"
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => refresh()}
          disabled={refreshDisabled}
        >
          {isRefreshing ? (
            <Spinner className="size-4" />
          ) : (
            <RefreshCcw className="size-4" />
          )}
          {t('refresh')}
        </PermissionButton>
      }
    />
  );
}
