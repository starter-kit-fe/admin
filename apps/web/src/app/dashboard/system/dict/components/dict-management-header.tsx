'use client';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Plus, RefreshCcw } from 'lucide-react';

import {
  useDictManagementRefresh,
  useDictManagementStatus,
  useDictManagementStore,
} from '@/app/dashboard/system/dict/store';

export function DictManagementHeader() {
  const { dictTypes, openTypeCreate } = useDictManagementStore();
  const { isRefreshing, isMutating } = useDictManagementStatus();
  const refresh = useDictManagementRefresh();
  const refreshDisabled = isRefreshing || isMutating;
  const count = dictTypes.length;

  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">字典管理</h1>
        <p className="text-sm text-muted-foreground">
          统一维护系统字典类型及字典项，支持筛选、快速新增与同步缓存。
        </p>
        <p className="text-xs text-muted-foreground">
          当前共 {count} 个字典类型，选择左侧列表管理其字典数据。
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
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
          刷新
        </Button>
        <Button
          type="button"
          onClick={() => openTypeCreate()}
          disabled={isMutating}
          className="flex items-center gap-2"
        >
          <Plus className="size-4" />
          新建字典
        </Button>
      </div>
    </section>
  );
}
