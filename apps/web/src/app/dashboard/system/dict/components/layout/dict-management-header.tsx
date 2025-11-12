'use client';

import {
  useDictManagementRefresh,
  useDictManagementStatus,
  useDictManagementStore,
} from '@/app/dashboard/system/dict/store';
import { ManagementHeader } from '@/components/dashboard/management-header';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { BookMarked, RefreshCw } from 'lucide-react';

export function DictManagementHeader() {
  const { dictTypes, openTypeCreate } = useDictManagementStore();
  const { isRefreshing, isMutating } = useDictManagementStatus();
  const refresh = useDictManagementRefresh();
  const refreshDisabled = isRefreshing || isMutating;
  const count = dictTypes.length;

  return (
    <ManagementHeader
      title="字典管理"
      description={`统一维护系统字典类型与字典项，当前共 ${count} 个字典类型。`}
      actions={
        <>
          <Button
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
            刷新
          </Button>
          <Button
            type="button"
            onClick={() => openTypeCreate()}
            disabled={isMutating}
          >
            <BookMarked className="size-4" />
            新建字典
          </Button>
        </>
      }
    />
  );
}
