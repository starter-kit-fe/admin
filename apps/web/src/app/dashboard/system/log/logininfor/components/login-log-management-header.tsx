'use client';

import { RefreshCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import {
  useLoginLogManagementRefresh,
  useLoginLogManagementStatus,
  useLoginLogManagementStore,
} from '../store';

export function LoginLogManagementHeader() {
  const { total } = useLoginLogManagementStore();
  const { isRefreshing, isMutating } = useLoginLogManagementStatus();
  const refresh = useLoginLogManagementRefresh();
  const refreshDisabled = isRefreshing || isMutating;

  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          登录日志
        </h1>
        <p className="text-sm text-muted-foreground">
          查看与排查后台登录记录，支持按账号、IP 与状态筛选。
        </p>
        <p className="text-xs text-muted-foreground">
          当前共 {total} 条日志。
        </p>
      </div>
      <div className="flex items-center gap-2">
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
