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
  const { isRefreshing, isMutating } = useCacheListStatus();
  const refresh = useCacheListRefresh();
  const tHeader = useTranslations('CacheMonitor.list.header');

  return (
    <ManagementHeader
      title={tHeader('title')}
      description={tHeader('description')}
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
              {tHeader('refreshing')}
            </>
          ) : (
            <>
              <RefreshCcw className="size-4" />
              {tHeader('refresh')}
            </>
          )}
        </PermissionButton>
      }
    />
  );
}
