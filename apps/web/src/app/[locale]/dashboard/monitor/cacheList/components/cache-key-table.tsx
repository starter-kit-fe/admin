'use client';

import { InlineLoading } from '@/components/loading';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Clipboard, TimerReset } from 'lucide-react';
import { useMemo } from 'react';
import { toast } from 'sonner';

import type { CacheKeyItem } from '../../cache/api/types';
import { formatBytes, formatDuration } from '../utils';

interface CacheKeyTableProps {
  rows: CacheKeyItem[];
  isLoading: boolean;
  isError: boolean;
  hasFilter: boolean;
}

export function CacheKeyTable({
  rows,
  isLoading,
  isError,
  hasFilter,
}: CacheKeyTableProps) {
  const columnHelper = useMemo(() => createColumnHelper<CacheKeyItem>(), []);

  const columns = useMemo(
    () => [
      columnHelper.accessor('key', {
        header: '键名',
        cell: (info) => {
          const value = info.getValue();
          const handleCopy = () => {
            void navigator.clipboard
              .writeText(value)
              .then(() => toast.success('已复制键名'))
              .catch(() => toast.error('复制失败'));
          };
          return (
            <div className="flex items-center gap-2 truncate font-mono text-sm">
              <span className="truncate">{value}</span>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="ml-auto text-muted-foreground hover:text-foreground"
                aria-label="复制键名"
                onClick={handleCopy}
              >
                <Clipboard className="size-4" />
              </Button>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[240px]',
          cellClassName: 'max-w-[420px]',
        },
      }),
      columnHelper.accessor('type', {
        header: '类型',
        cell: (info) => (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase">
            {info.getValue() ?? '-'}
          </span>
        ),
        meta: {
          headerClassName: 'min-w-[120px]',
        },
      }),
      columnHelper.accessor('ttlSeconds', {
        header: 'TTL',
        cell: (info) => (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TimerReset className="size-4 text-muted-foreground/70" />
            <span>{formatDuration(info.getValue())}</span>
          </div>
        ),
        meta: {
          headerClassName: 'min-w-[140px]',
        },
      }),
      columnHelper.accessor('idleSeconds', {
        header: '空闲时间',
        cell: (info) => <span>{formatDuration(info.getValue())}</span>,
        meta: {
          headerClassName: 'min-w-[140px]',
        },
      }),
      columnHelper.accessor('sizeBytes', {
        header: '估算大小',
        cell: (info) => <span>{formatBytes(info.getValue())}</span>,
        meta: {
          headerClassName: 'min-w-[140px]',
        },
      }),
      columnHelper.accessor('encoding', {
        header: '编码',
        cell: (info) => (
          <span className="uppercase">{info.getValue() ?? '-'}</span>
        ),
        meta: {
          headerClassName: 'min-w-[120px]',
        },
      }),
    ],
    [columnHelper],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const tableRows = table.getRowModel().rows;
  const visibleColumnCount =
    table.getVisibleLeafColumns().length || columns.length;

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="bg-muted/40">
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                className={cn(
                  header.column.columnDef.meta?.headerClassName as
                    | string
                    | undefined,
                )}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell
              colSpan={visibleColumnCount}
              className="h-32 text-center align-middle"
            >
              <InlineLoading label="正在加载缓存键..." />
            </TableCell>
          </TableRow>
        ) : isError ? (
          <TableRow>
            <TableCell
              colSpan={visibleColumnCount}
              className="h-24 text-center text-sm text-destructive"
            >
              加载失败，请稍后重试。
            </TableCell>
          </TableRow>
        ) : tableRows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={visibleColumnCount}
              className="h-48 text-center align-middle"
            >
              <Empty className="border-0 bg-transparent p-4">
                <EmptyHeader>
                  <EmptyTitle>未找到匹配的缓存键</EmptyTitle>
                  <EmptyDescription>
                    {hasFilter
                      ? '尝试调整匹配模式以获取更多结果。'
                      : '暂时没有可展示的缓存数据。'}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </TableCell>
          </TableRow>
        ) : (
          tableRows.map((row) => (
            <TableRow
              key={row.id}
              className="text-sm transition-colors hover:bg-muted/60"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cn(
                    cell.column.columnDef.meta?.cellClassName as
                      | string
                      | undefined,
                  )}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
