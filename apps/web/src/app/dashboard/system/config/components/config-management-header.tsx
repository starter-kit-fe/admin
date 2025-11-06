'use client';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Plus, RefreshCcw } from 'lucide-react';

import {
  useConfigManagementRefresh,
  useConfigManagementStatus,
  useConfigManagementStore,
} from '@/app/dashboard/system/config/store';

export function ConfigManagementHeader() {
  const { configs, openCreate } = useConfigManagementStore();
  const { isRefreshing, isMutating } = useConfigManagementStatus();
  const refresh = useConfigManagementRefresh();
  const refreshDisabled = isRefreshing || isMutating;

  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">参数设置</h1>
        <p className="text-sm text-muted-foreground">
          管理系统运行时配置，支持按关键字筛选、编辑和同步缓存。
        </p>
        <p className="text-xs text-muted-foreground">
          当前共 {configs.length} 条参数，请谨慎修改系统内置项。
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
          onClick={() => openCreate()}
          disabled={isMutating}
          className="flex items-center gap-2"
        >
          <Plus className="size-4" />
          新增参数
        </Button>
      </div>
    </section>
  );
}
