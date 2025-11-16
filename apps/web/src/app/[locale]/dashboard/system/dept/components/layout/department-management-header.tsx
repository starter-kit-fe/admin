'use client';

import { PermissionButton } from '@/components/permission-button';
import { Spinner } from '@/components/ui/spinner';
import { Plus, RefreshCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  useDepartmentEditorActions,
  useDepartmentManagementRefresh,
  useDepartmentManagementStatus,
} from '@/app/dashboard/system/dept/store';

export function DepartmentManagementHeader() {
  const { openCreate } = useDepartmentEditorActions();
  const { isRefreshing, isMutating } = useDepartmentManagementStatus();
  const refresh = useDepartmentManagementRefresh();
  const refreshDisabled = isRefreshing || isMutating;
  const t = useTranslations('DepartmentManagement.header');
  const descriptionRaw = t.raw('description') as string[] | string;
  const description = Array.isArray(descriptionRaw)
    ? descriptionRaw
    : [descriptionRaw];

  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t('title')}
        </h1>
        {description.map((line) => (
          <p key={line} className="text-sm text-muted-foreground">
            {line}
          </p>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <PermissionButton
          required="system:dept:list"
          type="button"
          variant="outline"
          onClick={() => refresh()}
          disabled={refreshDisabled}
          className="flex items-center gap-2"
        >
          {isRefreshing ? (
            <Spinner className="size-4" />
          ) : (
            <RefreshCcw className="size-4" />
          )}
          {t('actions.refresh')}
        </PermissionButton>
        <PermissionButton
          required="system:dept:add"
          type="button"
          onClick={() => openCreate(0)}
          disabled={isMutating}
          className="flex items-center gap-2"
        >
          <Plus className="size-4" />
          {t('actions.create')}
        </PermissionButton>
      </div>
    </section>
  );
}
