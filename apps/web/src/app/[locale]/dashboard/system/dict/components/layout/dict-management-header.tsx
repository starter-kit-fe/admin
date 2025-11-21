'use client';

import {
  useDictManagementRefresh,
  useDictManagementStatus,
  useDictTypeEditorActions,
  useDictTypesState,
} from '@/app/dashboard/system/dict/store';
import { ManagementHeader } from '@/components/dashboard/management-header';
import { PermissionButton } from '@/components/permission-button';
import { Spinner } from '@/components/ui/spinner';
import { BookMarked, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function DictManagementHeader() {
  const t = useTranslations('DictManagement');
  const { dictTypes } = useDictTypesState();
  const { openTypeCreate } = useDictTypeEditorActions();
  const { isRefreshing, isMutating } = useDictManagementStatus();
  const refresh = useDictManagementRefresh();
  const refreshDisabled = isRefreshing || isMutating;
  const count = dictTypes.length;

  return (
    <ManagementHeader
      title={t('header.title')}
      description={t('header.description', { count })}
      actions={
        <>
          <PermissionButton
            required="system:dict:list"
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
            {t('header.actions.refresh')}
          </PermissionButton>
          <PermissionButton
            required="system:dict:add"
            type="button"
            onClick={() => openTypeCreate()}
            disabled={isMutating}
          >
            <BookMarked className="size-4" />
            {t('header.actions.create')}
          </PermissionButton>
        </>
      }
    />
  );
}
