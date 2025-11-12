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

import type { LoginLog } from '../../type';
import { getLoginStatusBadgeVariant, getLoginStatusLabel } from '../../utils';

interface LoginLogTableProps {
  rows: LoginLog[];
  isLoading?: boolean;
  isError?: boolean;
  unlockPending?: boolean;
  onUnlock: (id: number) => void;
  onDelete: (log: LoginLog) => void;
}

export function LoginLogTable({
  rows,
  isLoading = false,
  isError = false,
  unlockPending = false,
  onUnlock,
  onDelete,
}: LoginLogTableProps) {
  const columnHelper = useMemo(() => createColumnHelper<LoginLog>(), []);

  const columns = useMemo(
    () => [
      columnHelper.accessor('userName', {
        header: () => '登录账号',
        cell: ({ row }) => {
          const log = row.original;
          return (
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {log.userName || '-'}
              </p>
              <p className="text-xs text-muted-foreground">
                地点：{log.loginLocation || '未知地点'}
              </p>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[200px]',
        },
      }),
      columnHelper.accessor('ipaddr', {
        header: () => '登录 IP',
        cell: ({ getValue }) => (
          <span className="text-sm text-foreground">{getValue() || '-'}</span>
        ),
        meta: {
          headerClassName: 'w-[160px]',
        },
      }),
      columnHelper.display({
        id: 'client',
        header: () => '客户端',
        cell: ({ row }) => {
          const log = row.original;
          return (
            <div className="space-y-1">
              <p className="text-sm text-foreground">{log.browser || '-'}</p>
              <p className="text-xs text-muted-foreground">{log.os || '-'}</p>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[180px]',
        },
      }),
      columnHelper.accessor('status', {
        header: () => '状态',
        cell: ({ getValue }) => (
          <Badge variant={getLoginStatusBadgeVariant(getValue())}>
            {getLoginStatusLabel(getValue())}
          </Badge>
        ),
        meta: {
          headerClassName: 'w-[120px]',
        },
      }),
      columnHelper.accessor('msg', {
        header: () => '提示信息',
        cell: ({ getValue }) => (
          <span className="line-clamp-2 text-sm text-muted-foreground">
            {getValue() || '-'}
          </span>
        ),
        meta: {
          headerClassName: 'min-w-[220px]',
          cellClassName: 'max-w-[320px]',
        },
      }),
      columnHelper.accessor('loginTime', {
        header: () => '登录时间',
        cell: ({ getValue }) => (
          <span className="text-sm text-foreground">{getValue() ?? '-'}</span>
        ),
        meta: {
          headerClassName: 'w-[160px]',
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="text-right">操作</div>,
        cell: ({ row }) => {
          const log = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={unlockPending}
                onClick={() => onUnlock(log.infoId)}
              >
                解除锁定
              </Button>
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
          headerClassName: 'w-[160px]',
          cellClassName: 'text-right',
        },
      }),
    ],
    [columnHelper, onDelete, onUnlock, unlockPending],
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
                  <InlineLoading label="正在加载登录日志..." />
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnCount}
                  className="h-24 text-center text-sm text-destructive"
                >
                  加载登录日志失败，请稍后再试。
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
                      <EmptyTitle>暂无登录日志数据</EmptyTitle>
                      <EmptyDescription>
                        当有新的登录行为时会自动汇总在此。
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
