'use client';

import { ManagementHeader } from '@/components/dashboard/management-header';
import { PermissionButton } from '@/components/permission-button';
import { Spinner } from '@/components/ui/spinner';
import { Megaphone, RefreshCw, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  useNoticeManagementRefresh,
  useNoticeManagementStatus,
  useNoticeManagementStore,
} from '@/app/dashboard/system/notice/store';

export function NoticeManagementHeader() {
  const t = useTranslations('NoticeManagement.header');
  const { notices, openCreate, selectedIds, setBulkDeleteOpen } =
    useNoticeManagementStore();
  const { isRefreshing, isMutating } = useNoticeManagementStatus();
  const refresh = useNoticeManagementRefresh();
  const refreshDisabled = isRefreshing || isMutating;
  const selectedCount = selectedIds.size;

  return (
    <section className="flex flex-col gap-2">
      <ManagementHeader
        title={t('title')}
        description={t('description')}
        actions={
          <>
            <PermissionButton
              required="system:notice:remove"
              type="button"
              variant="outline"
              className="relative"
              onClick={() => setBulkDeleteOpen(true)}
              disabled={selectedCount === 0 || isMutating}
            >
              <Trash2 className="size-4" />
              {t('bulkDelete')}
              {selectedCount > 0 ? (
                <span className="ml-1 text-xs text-muted-foreground">
                  {t('selectedCount', { count: selectedCount })}
                </span>
              ) : null}
            </PermissionButton>
            <PermissionButton
              required="system:notice:list"
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
              {t('refresh')}
            </PermissionButton>
            <PermissionButton
              required="system:notice:add"
              type="button"
              onClick={() => openCreate()}
              disabled={isMutating}
            >
              <Megaphone className="size-4" />
              {t('create')}
            </PermissionButton>
          </>
        }
      />
      <p className="text-xs text-muted-foreground">
        {t('summary', { total: notices.length, selected: selectedCount })}
      </p>
    </section>
  );
}
