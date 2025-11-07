'use client';

import { RefreshCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import {
  useOperLogManagementRefresh,
  useOperLogManagementStatus,
  useOperLogManagementStore,
} from '../store';

export function OperLogManagementHeader() {
  const { total } = useOperLogManagementStore();
  const { isRefreshing, isMutating } = useOperLogManagementStatus();
  const refresh = useOperLogManagementRefresh();
  const refreshDisabled = isRefreshing || isMutating;

  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          操作日志
        </h1>
        <p className="text-sm text-muted-foreground">
          追踪系统操作，支持按业务类型、状态与请求信息筛选。
        </p>
        <p className="text-xs text-muted-foreground">
          当前共 {total} 条记录。
        </p>
      </div>
      <div>
        <Button
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
          刷新
        </Button>
      </div>
    </section>
  );
}
