'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Trash2 } from 'lucide-react';
import { useMemo } from 'react';

import type { OperLog } from '../../type';
import {
  getBusinessTypeLabel,
  getOperLogStatusBadgeVariant,
  getOperLogStatusLabel,
} from '../../utils';

interface OperLogTableProps {
  rows: OperLog[];
  onDelete: (log: OperLog) => void;
}

export function OperLogTable({ rows, onDelete }: OperLogTableProps) {
  const columnHelper = useMemo(() => createColumnHelper<OperLog>(), []);

  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: () => '操作标题',
        cell: ({ getValue }) => (
          <span className="font-medium text-foreground">
            {getValue() || '-'}
          </span>
        ),
        meta: {
          headerClassName: 'min-w-[180px]',
        },
      }),
      columnHelper.accessor('businessType', {
        header: () => '业务类型',
        cell: ({ getValue }) => getBusinessTypeLabel(getValue()),
        meta: {
          headerClassName: 'min-w-[120px]',
        },
      }),
      columnHelper.accessor('status', {
        header: () => '执行结果',
        cell: ({ getValue }) => (
          <Badge variant={getOperLogStatusBadgeVariant(getValue())}>
            {getOperLogStatusLabel(getValue())}
          </Badge>
        ),
        meta: {
          headerClassName: 'min-w-[120px]',
        },
      }),
      columnHelper.accessor('requestMethod', {
        header: () => '请求方式',
        cell: ({ getValue }) => getValue() || '-',
        meta: {
          headerClassName: 'min-w-[120px]',
        },
      }),
      columnHelper.display({
        id: 'operator',
        header: () => '操作人员',
        cell: ({ row }) => {
          const log = row.original;
          return (
            <div className="flex flex-col">
              <span>{log.operName || '-'}</span>
              {log.operIp ? (
                <span className="text-xs text-muted-foreground">
                  {log.operIp}
                </span>
              ) : null}
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[160px]',
        },
      }),
      columnHelper.accessor('operUrl', {
        header: () => '请求地址',
        cell: ({ row, getValue }) => {
          const location = row.original.operLocation;
          return (
            <div className="flex flex-col">
              <span className="truncate">{getValue() || '-'}</span>
              {location ? (
                <span className="text-xs text-muted-foreground">
                  {location}
                </span>
              ) : null}
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[240px]',
          cellClassName: 'max-w-[320px]',
        },
      }),
      columnHelper.accessor('operTime', {
        header: () => '操作时间',
        cell: ({ getValue }) => getValue() ?? '-',
        meta: {
          headerClassName: 'min-w-[160px]',
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="text-right">操作</div>,
        cell: ({ row }) => {
          const log = row.original;
          return (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onDelete(log)}
              >
                <Trash2 className="size-4" />
                <span className="sr-only">删除</span>
              </Button>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[120px]',
          cellClassName: 'text-right',
        },
      }),
    ],
    [columnHelper, onDelete],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto">
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
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
  }
}
