import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Plus, RefreshCcw } from 'lucide-react';

import {
  useMenuManagementRefresh,
  useMenuManagementStatus,
  useMenuManagementStore,
} from '../store';

export function MenuManagementHeader() {
  const { openCreate } = useMenuManagementStore();
  const { isRefreshing, isMutating } = useMenuManagementStatus();
  const refresh = useMenuManagementRefresh();
  const refreshDisabled = isMutating || isRefreshing;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">菜单管理</h1>
          <p className="text-sm text-muted-foreground">
            支持上下移动调整同级菜单顺序，操作项可快速新增、编辑或删除。
          </p>
          <p className="text-sm text-muted-foreground">
            维护系统导航结构，支持快速新增、编辑及拖拽排序。
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
            onClick={() => openCreate(0)}
            disabled={isMutating}
            className="flex items-center gap-2"
          >
            <Plus className="size-4" />
            新增顶级菜单
          </Button>
        </div>
      </div>
    </section>
  );
}
