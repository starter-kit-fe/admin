'use client';

import { useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type RowSelectionState,
} from '@tanstack/react-table';
import { LogOut } from 'lucide-react';

import { InlineLoading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

import type { OnlineUser } from '../type';
import {
  getOnlineUserRowId,
  resolveStatusBadgeVariant,
} from '../utils';

interface OnlineUserTableProps {
  rows: OnlineUser[];
  rowSelection: RowSelectionState;
  onRowSelectionChange: (
    updater:
      | RowSelectionState
      | ((prev: RowSelectionState) => RowSelectionState),
  ) => void;
  onForceLogout: (user: OnlineUser) => void;
  pendingForceRowId: string | null;
  isForceMutating: boolean;
  isLoading: boolean;
  isError: boolean;
}

export function OnlineUserTable({
  rows,
  rowSelection,
  onRowSelectionChange,
  onForceLogout,
  pendingForceRowId,
  isForceMutating,
  isLoading,
  isError,
}: OnlineUserTableProps) {
  const columnHelper = useMemo(() => createColumnHelper<OnlineUser>(), []);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => {
          const checkedState = table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? 'indeterminate'
              : false;
          return (
            <Checkbox
              aria-label="选择全部"
              checked={checkedState}
              onCheckedChange={(checked) =>
                table.toggleAllPageRowsSelected(checked === true)
              }
            />
          );
        },
        cell: ({ row }) => (
          <Checkbox
            aria-label={`选择 ${row.original.userName || '用户'}`}
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onCheckedChange={(checked) =>
              row.toggleSelected(checked === true)
            }
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        meta: {
          headerClassName: 'w-12',
          cellClassName: 'w-12 align-middle',
        },
      }),
      columnHelper.accessor('userName', {
        header: () => '登录账号',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {user.userName || '-'}
              </p>
              <p className="text-xs text-muted-foreground">
                {user.nickName?.trim() || user.deptName?.trim() || '—'}
              </p>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[180px]',
        },
      }),
      columnHelper.display({
        id: 'ipaddr',
        header: () => 'IP / 地点',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="space-y-1">
              <p className="text-sm text-foreground">{user.ipaddr || '-'}</p>
              <p className="text-xs text-muted-foreground">
                {user.loginLocation || '未知地点'}
              </p>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[180px]',
        },
      }),
      columnHelper.display({
        id: 'client',
        header: () => '客户端',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="space-y-1">
              <p className="text-sm text-foreground">{user.browser || '-'}</p>
              <p className="text-xs text-muted-foreground">{user.os || '-'}</p>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[160px]',
        },
      }),
      columnHelper.display({
        id: 'status',
        header: () => '状态',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <Badge variant={resolveStatusBadgeVariant(user.status)}>
              {user.status === '0' || !user.status ? '在线' : '异常'}
            </Badge>
          );
        },
        meta: {
          headerClassName: 'w-[100px]',
          cellClassName: 'align-middle',
        },
      }),
      columnHelper.display({
        id: 'loginTime',
        header: () => '登录时间',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="space-y-1">
              <p className="text-sm text-foreground">
                {user.loginTime || '-'}
              </p>
              {user.lastAccessTime ? (
                <p className="text-xs text-muted-foreground">
                  最近活跃：{user.lastAccessTime}
                </p>
              ) : null}
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[180px]',
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="block text-right">操作</span>,
        cell: ({ row }) => {
          const user = row.original;
          const rowId = row.id;
          const isPending = isForceMutating && pendingForceRowId === rowId;

          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-sm font-medium"
                onClick={(event) => {
                  event.stopPropagation();
                  onForceLogout(user);
                }}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Spinner className="mr-1.5 size-4" />
                    处理中
                  </>
                ) : (
                  <>
                    <LogOut className="mr-1.5 size-3.5" />
                    强退
                  </>
                )}
              </Button>
            </div>
          );
        },
        enableSorting: false,
        meta: {
          headerClassName: 'w-[120px] text-right',
          cellClassName: 'text-right',
        },
      }),
    ],
    [columnHelper, isForceMutating, onForceLogout, pendingForceRowId],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      rowSelection,
    },
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => getOnlineUserRowId(row),
    onRowSelectionChange: onRowSelectionChange,
  });

  const visibleColumnCount =
    table.getVisibleLeafColumns().length || columns.length;

  return (
    <div className="rounded-xl border border-border/60">
      <div className="w-full overflow-x-auto">
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
                  <InlineLoading label="正在加载在线用户..." />
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
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnCount}
                  className="h-48 text-center align-middle"
                >
                  <Empty className="border-0 bg-transparent p-4">
                    <EmptyHeader>
                      <EmptyTitle>暂无在线用户</EmptyTitle>
                      <EmptyDescription>
                        当前无活跃会话，稍后或刷新系统查看最新在线情况。
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => {
                const isSelected = row.getIsSelected();
                return (
                  <TableRow
                    key={row.id}
                    className={cn(
                      'transition-colors hover:bg-muted/60',
                      isSelected && 'bg-emerald-50/70 dark:bg-emerald-500/20',
                    )}
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
