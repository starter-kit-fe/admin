'use client';

import { RefreshCcw } from 'lucide-react';

import { PermissionButton } from '@/components/permission-button';
import { Spinner } from '@/components/ui/spinner';
import { useTranslations } from 'next-intl';

import {
  useOperLogManagementRefresh,
  useOperLogManagementStatus,
  useOperLogManagementStore,
} from '../../store';

export function OperLogManagementHeader() {
  const tHeader = useTranslations('OperLogManagement.header');
  const { total } = useOperLogManagementStore();
  const { isRefreshing, isMutating } = useOperLogManagementStatus();
  const refresh = useOperLogManagementRefresh();
  const refreshDisabled = isRefreshing || isMutating;

  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {tHeader('title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {tHeader('description')}
        </p>
        <p className="text-xs text-muted-foreground">
          {tHeader('total', { count: total })}
        </p>
      </div>
      <div>
        <PermissionButton
          required="monitor:operlog:list"
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
          {tHeader('actions.refresh')}
        </PermissionButton>
      </div>
    </section>
  );
}
