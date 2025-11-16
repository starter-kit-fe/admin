'use client';

import {
  useConfigEditorActions,
  useConfigManagementRefresh,
  useConfigManagementStatus,
  useConfigsState,
} from '@/app/dashboard/system/config/store';
import { ManagementHeader } from '@/components/dashboard/management-header';
import { PermissionButton } from '@/components/permission-button';
import { Spinner } from '@/components/ui/spinner';
import { Plus, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ConfigManagementHeader() {
  const t = useTranslations('ConfigManagement.header');
  const { configs } = useConfigsState();
  const { openCreate } = useConfigEditorActions();
  const { isRefreshing, isMutating } = useConfigManagementStatus();
  const refresh = useConfigManagementRefresh();
  const refreshDisabled = isRefreshing || isMutating;

  return (
    <section className="space-y-2">
      <ManagementHeader
        title={t('title')}
        description={t('description')}
        actions={
          <>
            <PermissionButton
              required="system:config:list"
              type="button"
              variant="outline"
              onClick={() => refresh()}
              disabled={refreshDisabled}
              className="gap-2"
            >
              {isRefreshing ? (
                <Spinner className="size-4" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {t('refresh')}
            </PermissionButton>
            <PermissionButton
              required="system:config:add"
              type="button"
              onClick={() => openCreate()}
              disabled={isMutating}
              className="gap-2"
            >
              <Plus className="size-4" />
              {t('create')}
            </PermissionButton>
          </>
        }
      />
      <p className="text-xs text-muted-foreground">
        {t('summary', { count: configs.length })}
      </p>
    </section>
  );
}
