'use client';

import { useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Clipboard, TimerReset } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

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

import type { CacheKeyItem } from '../api/types';
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
  const tTable = useTranslations('CacheMonitor.table');
  const tCommon = useTranslations('CacheMonitor.common');
  const durationLabels = useMemo(
    () => ({
      unknown: tCommon('unknown'),
      permanent: tCommon('permanent'),
    }),
    [tCommon],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor('key', {
        header: tTable('columns.key'),
        cell: (info) => {
          const value = info.getValue();
          const handleCopy = () => {
            void navigator.clipboard
              .writeText(value)
              .then(() => toast.success(tTable('copy.success')))
              .catch(() => toast.error(tTable('copy.error')));
          };
          return (
            <div className="flex items-center gap-2 truncate font-mono text-sm">
              <span className="truncate">{value}</span>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="ml-auto text-muted-foreground hover:text-foreground"
                aria-label={tTable('aria.copy')}
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
        header: tTable('columns.type'),
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
        header: tTable('columns.ttl'),
        cell: (info) => (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TimerReset className="size-4 text-muted-foreground/70" />
            <span>{formatDuration(info.getValue(), durationLabels)}</span>
          </div>
        ),
        meta: {
          headerClassName: 'min-w-[140px]',
        },
      }),
      columnHelper.accessor('idleSeconds', {
        header: tTable('columns.idle'),
        cell: (info) => (
          <span>{formatDuration(info.getValue(), durationLabels)}</span>
        ),
        meta: {
          headerClassName: 'min-w-[140px]',
        },
      }),
      columnHelper.accessor('sizeBytes', {
        header: tTable('columns.size'),
        cell: (info) => (
          <span>{formatBytes(info.getValue(), { decimals: 2 })}</span>
        ),
        meta: {
          headerClassName: 'min-w-[140px]',
        },
      }),
      columnHelper.accessor('encoding', {
        header: tTable('columns.encoding'),
        cell: (info) => (
          <span className="uppercase">{info.getValue() ?? '-'}</span>
        ),
        meta: {
          headerClassName: 'min-w-[120px]',
        },
      }),
    ],
    [columnHelper, durationLabels, tTable],
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
          <TableRow key={headerGroup.id}>
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
              <InlineLoading label={tTable('loading')} />
            </TableCell>
          </TableRow>
        ) : isError ? (
          <TableRow>
            <TableCell
              colSpan={visibleColumnCount}
              className="h-24 text-center text-sm text-destructive"
            >
              {tTable('error')}
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
                  <EmptyTitle>{tTable('emptyTitle')}</EmptyTitle>
                  <EmptyDescription>
                    {hasFilter
                      ? tTable('emptyDescription.filtered')
                      : tTable('emptyDescription.noFilter')}
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
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext(),
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
