import { StatusTabs, type StatusTabItem } from '@/components/status-tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Plus, RefreshCcw } from 'lucide-react';

interface MenuManagementHeaderProps {
  onRefresh: () => void;
  onCreateRoot: () => void;
  disableActions?: boolean;
  isRefreshing?: boolean;
  status: string;
  statusTabs: StatusTabItem[];
  onStatusChange: (value: string) => void;
  keyword: string;
  onKeywordChange: (value: string) => void;
}

export function MenuManagementHeader({
  onRefresh,
  onCreateRoot,
  disableActions = false,
  isRefreshing = false,
  status,
  statusTabs,
  onStatusChange,
  keyword,
  onKeywordChange,
}: MenuManagementHeaderProps) {
  const refreshDisabled = disableActions || isRefreshing;

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
            onClick={onRefresh}
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
            onClick={onCreateRoot}
            disabled={disableActions}
            className="flex items-center gap-2"
          >
            <Plus className="size-4" />
            新增顶级菜单
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StatusTabs
          value={status}
          onValueChange={onStatusChange}
          tabs={statusTabs}
        />
        <Input
          placeholder="搜索菜单名称"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          className="sm:max-w-sm"
        />
      </div>
    </section>
  );
}
