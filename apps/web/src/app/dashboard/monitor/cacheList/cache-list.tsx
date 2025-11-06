'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Clipboard, RefreshCcw, Search, TimerReset } from 'lucide-react';
import { toast } from 'sonner';

import { InlineLoading } from '@/components/loading';
import { PaginationToolbar } from '@/components/pagination/pagination-toolbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { listCacheKeys, type CacheKeyListParams } from '../cache/api';
import type { CacheKeyItem, CacheKeyListResponse } from '../cache/type';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function formatBytes(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return '-';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const power = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const adjusted = value / Math.pow(1024, power);
  return `${adjusted.toFixed(power === 0 ? 0 : 2)} ${units[power]}`;
}

function formatDuration(seconds?: number | null) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) {
    return '未知';
  }
  if (seconds < 0) {
    return '永久';
  }
  if (seconds < 60) {
    return `${seconds}s`;
  }
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
}

export function CacheList() {
  const [patternInput, setPatternInput] = useState('');
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);

  const debouncedPattern = useDebouncedValue(patternInput.trim(), 250);

  useEffect(() => {
    setPageNum(1);
  }, [debouncedPattern, pageSize]);

  const params = useMemo<CacheKeyListParams>(() => {
    const base: CacheKeyListParams = {
      pageNum,
      pageSize,
    };
    if (debouncedPattern) {
      base.pattern = debouncedPattern;
    }
    return base;
  }, [pageNum, pageSize, debouncedPattern]);

  const query = useQuery({
    queryKey: ['monitor', 'cache', 'list', params],
    queryFn: () => listCacheKeys(params),
    keepPreviousData: true,
  });

  const data = query.data ?? ({} as CacheKeyListResponse);
  const rows = data.items ?? [];
  const total = typeof data.total === 'number' && data.total >= 0 ? data.total : rows.length;

  const columnHelper = useMemo(() => createColumnHelper<CacheKeyItem>(), []);

  const columns = useMemo(
    () => [
      columnHelper.accessor('key', {
        header: '键名',
        cell: (info) => {
          const value = info.getValue();
          return (
            <div className="flex items-center gap-2 truncate font-mono text-sm">
              <span className="truncate">{value}</span>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="ml-auto text-muted-foreground hover:text-foreground"
                onClick={() => {
                  void navigator.clipboard
                    .writeText(value)
                    .then(() => toast.success('已复制键名'))
                    .catch(() => toast.error('复制失败'));
                }}
              >
                <Clipboard className="size-4" />
              </Button>
            </div>
          );
        },
      }),
      columnHelper.accessor('type', {
        header: '类型',
        cell: (info) => <span className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase">{info.getValue() ?? '-'}</span>,
      }),
      columnHelper.accessor('ttlSeconds', {
        header: 'TTL',
        cell: (info) => (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TimerReset className="size-4 text-muted-foreground/70" />
            <span>{formatDuration(info.getValue())}</span>
          </div>
        ),
      }),
      columnHelper.accessor('idleSeconds', {
        header: '空闲时间',
        cell: (info) => <span>{formatDuration(info.getValue())}</span>,
      }),
      columnHelper.accessor('sizeBytes', {
        header: '估算大小',
        cell: (info) => <span>{formatBytes(info.getValue())}</span>,
      }),
      columnHelper.accessor('encoding', {
        header: '编码',
        cell: (info) => <span className="uppercase">{info.getValue() ?? '-'}</span>,
      }),
    ],
    [columnHelper],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    state: {
      pagination: {
        pageIndex: pageNum - 1,
        pageSize,
      },
    },
  });

  const limitedTip =
    data.limited && data.scanned
      ? `出于性能考虑仅展示前 ${data.scanned} 条匹配结果`
      : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
      <Card className="border-border/60 bg-card/90 shadow-sm dark:border-border/40">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg font-semibold">缓存键列表</CardTitle>
          <CardDescription>支持通配符检索，默认最多展示 5000 条数据。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="通过模式匹配键名，例如 user:*"
                className="pl-9"
                value={patternInput}
                onChange={(event) => setPatternInput(event.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              {query.isFetching ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  刷新中
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 size-4" />
                  刷新
                </>
              )}
            </Button>
          </div>
          {limitedTip ? (
            <div className="rounded-full border border-amber-300/80 bg-amber-50 px-3 py-1 text-xs text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200">
              {limitedTip}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm dark:border-border/40">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32">
                      <div className="flex items-center justify-center">
                        <InlineLoading label="正在加载缓存键..." />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32">
                      <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                        <span>未找到匹配的缓存键</span>
                        {debouncedPattern ? (
                          <span className="text-xs text-muted-foreground/80">尝试调整匹配模式</span>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="text-sm">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className={cn(cell.column.id === 'key' ? 'max-w-[420px]' : undefined)}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="border-t border-border/60 p-4">
            <PaginationToolbar
              totalItems={total}
              currentPage={pageNum}
              pageSize={pageSize}
              onPageChange={(nextPage) => setPageNum(nextPage)}
              onPageSizeChange={(nextSize) => setPageSize(nextSize)}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              disabled={query.isFetching}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
