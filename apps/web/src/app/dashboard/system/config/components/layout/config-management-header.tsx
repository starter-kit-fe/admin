'use client';

import {
  useConfigEditorActions,
  useConfigManagementRefresh,
  useConfigManagementStatus,
  useConfigsState,
} from '@/app/dashboard/system/config/store';
import { ManagementHeader } from '@/components/dashboard/management-header';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Plus, RefreshCw } from 'lucide-react';

export function ConfigManagementHeader() {
  const { configs } = useConfigsState();
  const { openCreate } = useConfigEditorActions();
  const { isRefreshing, isMutating } = useConfigManagementStatus();
  const refresh = useConfigManagementRefresh();
  const refreshDisabled = isRefreshing || isMutating;

  return (
    <section className="space-y-2">
      <ManagementHeader
        title="参数设置"
        description="管理系统运行时配置，支持按关键字筛选、编辑和同步缓存。"
        actions={
          <>
            <Button
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
              刷新
            </Button>
            <Button
              type="button"
              onClick={() => openCreate()}
              disabled={isMutating}
              className="gap-2"
            >
              <Plus className="size-4" />
              新增参数
            </Button>
          </>
        }
      />
      <p className="text-xs text-muted-foreground">
        当前共 {configs.length} 条参数，请谨慎修改系统内置项。
      </p>
    </section>
  );
}
