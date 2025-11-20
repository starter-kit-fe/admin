'use client';

import { useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type RowSelectionState,
} from '@tanstack/react-table';
import { Eye, LogOut, MoreHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  PINNED_ACTION_COLUMN_META,
  PINNED_TABLE_CLASS,
} from '@/components/table/pinned-actions';
import { TableLoadingSkeleton } from '@/components/table/table-loading-skeleton';

import type { OnlineUser } from '../../type';
import {
  getOnlineUserRowId,
  resolveStatusBadgeVariant,
} from '../../utils';

interface OnlineUserTableProps {
  rows: OnlineUser[];
  rowSelection: RowSelectionState;
  onRowSelectionChange: (
    updater:
      | RowSelectionState
      | ((prev: RowSelectionState) => RowSelectionState),
  ) => void;
  onForceLogout: (user: OnlineUser) => void;
  onViewDetail: (user: OnlineUser) => void;
  pendingForceRowId: string | null;
  isForceMutating: boolean;
  isLoading: boolean;
  isError: boolean;
  canSelectRows: boolean;
  canForceLogout: boolean;
  canViewDetail: boolean;
}

export function OnlineUserTable({
  rows,
  rowSelection,
  onRowSelectionChange,
  onForceLogout,
  onViewDetail,
  pendingForceRowId,
  isForceMutating,
  isLoading,
  isError,
  canSelectRows,
  canForceLogout,
  canViewDetail,
}: OnlineUserTableProps) {
  const columnHelper = useMemo(() => createColumnHelper<OnlineUser>(), []);

  const columns = useMemo(() => {
    const baseColumns = [
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
          headerClassName: 'min-w-[140px] md:min-w-[180px]',
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
          headerClassName: 'min-w-[140px] md:min-w-[180px]',
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
          headerClassName: 'min-w-[130px] md:min-w-[160px]',
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
          headerClassName: 'w-[90px]',
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
          headerClassName: 'min-w-[150px] md:min-w-[180px]',
        },
      }),
    ];

    if (canForceLogout || canViewDetail) {
      baseColumns.push(
        columnHelper.display({
          id: 'actions',
          header: () => <span className="block text-right">操作</span>,
          cell: ({ row }) => {
            const user = row.original;
            const rowId = row.id;
            const isPending =
              canForceLogout &&
              isForceMutating &&
              pendingForceRowId === rowId;

              return (
              <div className="flex justify-end">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 hover:text-primary"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => event.stopPropagation()}
                      aria-label="更多操作"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {canViewDetail ? (
                      <DropdownMenuItem
                        onSelect={() => onViewDetail(user)}
                      >
                        <Eye className="mr-2 size-4" />
                        查看详情
                      </DropdownMenuItem>
                    ) : null}
                    {canViewDetail && canForceLogout ? (
                      <DropdownMenuSeparator />
                    ) : null}
                    {canForceLogout ? (
                      <DropdownMenuItem
                        disabled={isPending}
                        onSelect={() => onForceLogout(user)}
                        className="text-destructive focus:text-destructive"
                      >
                        {isPending ? (
                          <>
                            <Spinner className="mr-2 size-4" />
                            处理中
                          </>
                        ) : (
                          <>
                            <LogOut className="mr-2 size-4" />
                            强退
                          </>
                        )}
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          },
          enableSorting: false,
          meta: { ...PINNED_ACTION_COLUMN_META },
        }),
      );
    }

    if (canSelectRows) {
      baseColumns.unshift(
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
      );
    }

    return baseColumns;
  }, [
    canForceLogout,
    canViewDetail,
    canSelectRows,
    columnHelper,
    isForceMutating,
    onForceLogout,
    onViewDetail,
    pendingForceRowId,
  ]);

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      rowSelection,
    },
    enableRowSelection: canSelectRows,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => getOnlineUserRowId(row),
    onRowSelectionChange: onRowSelectionChange,
  });

  const visibleColumnCount =
    table.getVisibleLeafColumns().length || columns.length;

  return (
    <div className="rounded-xl border border-border/60">
      <Table className={`${PINNED_TABLE_CLASS} [&_td]:align-top`}>
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
            <TableLoadingSkeleton columns={visibleColumnCount} />
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
                    'group transition-colors hover:bg-muted/60',
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
  );
}
