'use client';

import { InlineLoading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
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
import { Trash2 } from 'lucide-react';
import { useMemo } from 'react';

import type { OperLog } from '../../type';
import {
  getBusinessTypeLabel,
  getOperLogStatusBadgeVariant,
  getOperLogStatusLabel,
} from '../../utils';
import { usePermissions } from '@/hooks/use-permissions';

interface OperLogTableProps {
  rows: OperLog[];
  onDelete: (log: OperLog) => void;
  isLoading: boolean;
  isError: boolean;
}

export function OperLogTable({
  rows,
  onDelete,
  isLoading,
  isError,
}: OperLogTableProps) {
  const columnHelper = useMemo(() => createColumnHelper<OperLog>(), []);
  const { hasPermission } = usePermissions();
  const canDeleteOperLog = hasPermission('monitor:operlog:remove');

  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: () => '操作标题',
        cell: ({ row }) => {
          const log = row.original;
          return (
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {log.title || '-'}
              </p>
              <p className="text-xs text-muted-foreground">
                部门：{log.deptName || '未分配'}
              </p>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[200px]',
        },
      }),
      columnHelper.accessor('businessType', {
        header: () => '业务类型',
        cell: ({ getValue }) => (
          <Badge variant="secondary" className="rounded-full px-2 py-0.5">
            {getBusinessTypeLabel(getValue())}
          </Badge>
        ),
        meta: {
          headerClassName: 'w-[120px]',
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
          headerClassName: 'w-[120px]',
        },
      }),
      columnHelper.accessor('requestMethod', {
        header: () => '请求方式',
        cell: ({ getValue }) => (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-mono uppercase text-foreground/80">
            {getValue() || '-'}
          </span>
        ),
        meta: {
          headerClassName: 'w-[140px]',
        },
      }),
      columnHelper.display({
        id: 'operator',
        header: () => '操作人员',
        cell: ({ row }) => {
          const log = row.original;
          return (
            <div className="space-y-1">
              <p className="text-sm text-foreground">{log.operName || '-'}</p>
              {log.operIp ? (
                <p className="text-xs text-muted-foreground">
                  IP：{log.operIp}
                </p>
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
            <div className="space-y-1">
              <p className="truncate text-sm text-foreground">
                {getValue() || '-'}
              </p>
              {location ? (
                <p className="text-xs text-muted-foreground">{location}</p>
              ) : null}
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[260px]',
          cellClassName: 'max-w-[320px]',
        },
      }),
      columnHelper.accessor('operTime', {
        header: () => '操作时间',
        cell: ({ row }) => {
          const log = row.original;
          return (
            <div className="space-y-1 text-sm text-foreground">
              <p>{log.operTime || '-'}</p>
              {log.costTime ? (
                <p className="text-xs text-muted-foreground">
                  耗时：{log.costTime}ms
                </p>
              ) : null}
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[160px]',
        },
      }),
      ...(canDeleteOperLog
        ? [
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
                headerClassName: 'w-[120px]',
                cellClassName: 'text-right',
              },
            }),
          ]
        : []),
    ],
    [canDeleteOperLog, columnHelper, onDelete],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const visibleColumnCount =
    table.getVisibleLeafColumns().length || columns.length;

  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <div className="w-full overflow-x-auto">
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
                  <InlineLoading label="正在加载操作日志..." />
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnCount}
                  className="h-24 text-center text-sm text-destructive"
                >
                  加载失败，请稍后再试。
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnCount}
                  className="h-48 text-center align-middle"
                >
                  <Empty className="border-0 bg-transparent p-4">
                    <EmptyHeader>
                      <EmptyTitle>暂无操作日志</EmptyTitle>
                      <EmptyDescription>
                        执行新增、修改或删除后会记录在这里。
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="transition-colors hover:bg-muted/60"
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
      </div>
    </div>
  );
}

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
  }
}
