'use client';

import { RefreshCcw } from 'lucide-react';

import { ManagementHeader } from '@/components/dashboard/management-header';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import {
  useCacheListRefresh,
  useCacheListStatus,
} from '../store';

export function CacheManagementHeader() {
  const { isRefreshing, isMutating } = useCacheListStatus();
  const refresh = useCacheListRefresh();

  return (
    <ManagementHeader
      title="缓存键列表"
      description="检索和定位缓存键，支持按模式过滤与分页查看。"
      actions={
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => refresh()}
          disabled={isRefreshing || isMutating}
        >
          {isRefreshing ? (
            <>
              <Spinner className="size-4" />
              刷新中
            </>
          ) : (
            <>
              <RefreshCcw className="size-4" />
              刷新
            </>
          )}
        </Button>
      }
    />
  );
}
