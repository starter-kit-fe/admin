'use client';

import { useEffect, useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { PaginationToolbar } from '@/components/pagination/pagination-toolbar';

import {
  listCacheKeys,
  type CacheKeyListParams,
} from '../../cache/api';
import type { CacheKeyListResponse } from '../../cache/api/types';
import { formatNumber } from '../../cache/utils';
import {
  CACHE_LIST_PAGE_SIZE_OPTIONS,
  CACHE_LIST_QUERY_KEY,
} from '../constants';
import {
  useCacheListManagementStore,
  useCacheListSetRefreshHandler,
  useCacheListSetRefreshing,
} from '../store';
import { CacheKeyTable } from './cache-key-table';

export function CacheListDataSection() {
  const { appliedFilters, pagination, setPagination } =
    useCacheListManagementStore();
  const setRefreshing = useCacheListSetRefreshing();
  const setRefreshHandler = useCacheListSetRefreshHandler();

  const tFilters = useTranslations('CacheMonitor.list.filters');
  const queryParams = useMemo<CacheKeyListParams>(() => {
    const params: CacheKeyListParams = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
    };
    const trimmedPattern = appliedFilters.pattern.trim();
    if (trimmedPattern) {
      params.pattern = trimmedPattern;
    }
    return params;
  }, [
    appliedFilters.pattern,
    pagination.pageNum,
    pagination.pageSize,
  ]);

  const query = useQuery({
    queryKey: [...CACHE_LIST_QUERY_KEY, queryParams],
    queryFn: () => listCacheKeys(queryParams),
    placeholderData: keepPreviousData,
  });

  const data = query.data ?? ({} as CacheKeyListResponse);
  const rows = data.items ?? [];
  const total =
    typeof data.total === 'number' && data.total >= 0
      ? data.total
      : rows.length;

  const limitedTip =
    data.limited && data.scanned
      ? tFilters('limitedTip', { count: formatNumber(data.scanned) })
      : null;

  const isLoading = query.isLoading && rows.length === 0;
  const isError = query.isError && rows.length === 0;
  const hasFilter = Boolean(appliedFilters.pattern.trim());

  useEffect(() => {
    setRefreshing(query.isFetching);
  }, [query.isFetching, setRefreshing]);

  useEffect(() => {
    const refetch = query.refetch;
    setRefreshHandler(() => {
      void refetch();
    });
    return () => {
      setRefreshHandler(() => {});
    };
  }, [query.refetch, setRefreshHandler]);

  const handlePageChange = (nextPage: number) => {
    setPagination((prev) => ({ ...prev, pageNum: nextPage }));
  };

  const handlePageSizeChange = (nextSize: number) => {
    setPagination((prev) => ({
      ...prev,
      pageNum: 1,
      pageSize: nextSize,
    }));
  };

  const shouldShowPagination = !isLoading && !isError && total > 0;

  return (
    <div className="flex flex-col gap-4">
      {limitedTip ? (
        <div className="rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1 text-xs text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200">
          {limitedTip}
        </div>
      ) : null}
      <section className="overflow-hidden rounded-xl border border-border/70 bg-card/90 dark:border-border/40">
        <div className="w-full overflow-x-auto">
          <CacheKeyTable
            rows={rows}
            isLoading={isLoading}
            isError={isError}
            hasFilter={hasFilter}
          />
        </div>
      </section>
      {shouldShowPagination ? (
        <PaginationToolbar
          totalItems={total}
          currentPage={pagination.pageNum}
          pageSize={pagination.pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={CACHE_LIST_PAGE_SIZE_OPTIONS}
          disabled={query.isFetching}
        />
      ) : null}
    </div>
  );
}
