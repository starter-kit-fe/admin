'use client';

import { RefreshCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ManagementHeader } from '@/components/dashboard/management-header';
import { PermissionButton } from '@/components/permission-button';
import { Spinner } from '@/components/ui/spinner';

import {
  useCacheListRefresh,
  useCacheListStatus,
} from '../store';

export function CacheManagementHeader() {
  const t = useTranslations('CacheMonitor');
  const { isRefreshing, isMutating } = useCacheListStatus();
  const refresh = useCacheListRefresh();

  return (
    <ManagementHeader
      title={t('list.header.title')}
      description={t('list.header.description')}
      actions={
        <PermissionButton
          required="monitor:cache:list"
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => refresh()}
          disabled={isRefreshing || isMutating}
        >
          {isRefreshing ? (
            <>
              <Spinner className="size-4" />
              {t('list.header.refreshing')}
            </>
          ) : (
            <>
              <RefreshCcw className="size-4" />
              {t('list.header.refresh')}
            </>
          )}
        </PermissionButton>
      }
    />
  );
}
