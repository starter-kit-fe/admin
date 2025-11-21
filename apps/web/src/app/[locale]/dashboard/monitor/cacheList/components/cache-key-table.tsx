'use client';

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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TableLoadingSkeleton } from '@/components/table/table-loading-skeleton';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Check, Clipboard, TimerReset } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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

  const KeyCell = ({ value }: { value: string }) => {
    const display = value || '-';
    const [copied, setCopied] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const textRef = useRef<HTMLSpanElement>(null);
    const resetTimerRef = useRef<number | undefined>(null);

    useLayoutEffect(() => {
      const node = textRef.current;
      if (!node) return;
      const checkOverflow = () => {
        if (!node) return;
        setIsOverflowing(node.scrollWidth - node.clientWidth > 1);
      };
      checkOverflow();
      const resizeObserver = new ResizeObserver(checkOverflow);
      resizeObserver.observe(node);
      window.addEventListener('resize', checkOverflow);
      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', checkOverflow);
      };
    }, [display]);

    useEffect(
      () => () => {
        if (resetTimerRef.current) {
          window.clearTimeout(resetTimerRef.current);
        }
      },
      [],
    );

    const handleCopy = () => {
      void navigator.clipboard
        .writeText(display)
        .then(() => {
          toast.success('已复制键名');
          setCopied(true);
          if (resetTimerRef.current) {
            window.clearTimeout(resetTimerRef.current);
          }
          resetTimerRef.current = window.setTimeout(
            () => setCopied(false),
            2000,
          );
        })
        .catch(() => toast.error('复制失败'));
    };

    const cellContent = (
      <div className="flex min-w-0 items-center gap-2">
        <span ref={textRef} className="min-w-0 truncate font-mono text-sm">
          {display}
        </span>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className="ml-auto text-muted-foreground hover:text-foreground"
          aria-label="复制键名"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="size-4" />
          ) : (
            <Clipboard className="size-4" />
          )}
        </Button>
      </div>
    );

    if (!isOverflowing) {
      return cellContent;
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{cellContent}</TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          className="max-w-xl break-all font-mono text-xs"
        >
          {display}
        </TooltipContent>
      </Tooltip>
    );
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('key', {
        header: '键名',
        cell: (info) => {
          const value = info.getValue();
          return <KeyCell value={value} />;
        },
        meta: {
          headerClassName: 'w-[360px] max-w-[360px]',
          cellClassName: 'w-[360px] max-w-[360px]',
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
          headerClassName: 'w-[140px]',
          cellClassName: 'w-[140px]',
        },
      }),
      columnHelper.accessor('idleSeconds', {
        header: '空闲时间',
        cell: (info) => <span>{formatDuration(info.getValue())}</span>,
        meta: {
          headerClassName: 'w-[140px]',
          cellClassName: 'w-[140px]',
        },
      }),
      columnHelper.accessor('sizeBytes', {
        header: '估算大小',
        cell: (info) => <span>{formatBytes(info.getValue())}</span>,
        meta: {
          headerClassName: 'w-[140px]',
          cellClassName: 'w-[140px]',
        },
      }),
      columnHelper.accessor('encoding', {
        header: '编码',
        cell: (info) => (
          <span className="uppercase">{info.getValue() ?? '-'}</span>
        ),
        meta: {
          headerClassName: 'w-[120px]',
          cellClassName: 'w-[120px]',
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
    <Table className="min-w-[960px] table-fixed">
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
          <TableLoadingSkeleton
            columns={visibleColumnCount}
            className="bg-muted/20"
          />
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
