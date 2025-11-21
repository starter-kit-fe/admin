'use client';

import { useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type RowSelectionState,
} from '@tanstack/react-table';
import { Eye, LogOut, MoreHorizontal } from 'lucide-react';

import { EllipsisText } from '@/components/table/ellipsis-text';
import {
  PINNED_ACTION_COLUMN_META,
  PINNED_TABLE_CLASS,
} from '@/components/table/pinned-actions';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  TableLoadingSkeleton,
} from '@/components/table/table-loading-skeleton';

import type { OnlineUser } from '../../type';
import { getOnlineUserRowId, resolveStatusBadgeVariant } from '../../utils';

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
              <EllipsisText
                value={user.userName || '-'}
                className="max-w-[200px] text-sm font-medium text-foreground"
              />
              <EllipsisText
                value={user.nickName?.trim() || user.deptName?.trim() || '—'}
                className="max-w-[200px] text-xs text-muted-foreground"
              />
            </div>
          );
        },
        meta: {
          headerClassName: 'w-[220px]',
          cellClassName: 'w-[220px]',
        },
      }),
      columnHelper.display({
        id: 'ipaddr',
        header: () => 'IP / 地点',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="space-y-1">
              <EllipsisText
                value={user.ipaddr || '-'}
                className="max-w-[200px] text-sm text-foreground"
              />
              <EllipsisText
                value={user.loginLocation || '未知地点'}
                className="max-w-[220px] text-xs text-muted-foreground"
              />
            </div>
          );
        },
        meta: {
          headerClassName: 'w-[240px]',
          cellClassName: 'w-[240px]',
        },
      }),
      columnHelper.display({
        id: 'client',
        header: () => '客户端',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="space-y-1">
              <EllipsisText
                value={user.browser || '-'}
                className="max-w-[180px] text-sm text-foreground"
              />
              <EllipsisText
                value={user.os || '-'}
                className="max-w-[200px] text-xs text-muted-foreground"
              />
            </div>
          );
        },
        meta: {
          headerClassName: 'w-[200px]',
          cellClassName: 'w-[200px]',
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
              <EllipsisText
                value={user.loginTime || '-'}
                className="max-w-[200px] text-sm text-foreground"
              />
              {user.lastAccessTime ? (
                <EllipsisText
                  value={`最近活跃：${user.lastAccessTime}`}
                  className="max-w-[220px] text-xs text-muted-foreground"
                />
              ) : null}
            </div>
          );
        },
        meta: {
          headerClassName: 'w-[220px]',
          cellClassName: 'w-[220px]',
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
                <OnlineRowActions
                  user={user}
                  canViewDetail={canViewDetail}
                  canForceLogout={canForceLogout}
                  onViewDetail={onViewDetail}
                  onForceLogout={onForceLogout}
                  isPending={isPending}
                />
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
      <Table className={cn(PINNED_TABLE_CLASS, 'min-w-[980px] [&_td]:align-top')}>
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

function OnlineRowActions({
  user,
  canViewDetail,
  canForceLogout,
  onViewDetail,
  onForceLogout,
  isPending,
}: {
  user: OnlineUser;
  canViewDetail: boolean;
  canForceLogout: boolean;
  onViewDetail: (user: OnlineUser) => void;
  onForceLogout: (user: OnlineUser) => void;
  isPending: boolean;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (!canViewDetail && !canForceLogout) {
    return null;
  }

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label="更多操作"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="h-auto w-full max-w-full rounded-t-2xl border-t p-0"
        >
          <SheetHeader className="px-4 pb-2 pt-3 text-left">
            <SheetTitle>在线会话</SheetTitle>
            <SheetDescription>选择要对该用户执行的操作。</SheetDescription>
          </SheetHeader>
          <SheetFooter className="mt-0 flex-col gap-2 px-4 pb-4">
            {canViewDetail ? (
              <Button
                variant="secondary"
                className="w-full justify-between"
                onClick={() => {
                  onViewDetail(user);
                  setOpen(false);
                }}
              >
                <span className="flex items-center gap-2">
                  <Eye className="size-4" />
                  查看详情
                </span>
                <span className="text-xs text-muted-foreground">查看会话信息</span>
              </Button>
            ) : null}
            {canForceLogout ? (
              <Button
                variant="destructive"
                className="w-full justify-start gap-2"
                disabled={isPending}
                onClick={() => {
                  onForceLogout(user);
                  setOpen(false);
                }}
              >
                {isPending ? (
                  <>
                    <Spinner className="size-4" />
                    处理中
                  </>
                ) : (
                  <>
                    <LogOut className="size-4" />
                    强退
                  </>
                )}
              </Button>
            ) : null}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
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
            onSelect={(event) => {
              event.preventDefault();
              onViewDetail(user);
            }}
          >
            <Eye className="mr-2 size-4" />
            查看详情
          </DropdownMenuItem>
        ) : null}
        {canViewDetail && canForceLogout ? <DropdownMenuSeparator /> : null}
        {canForceLogout ? (
          <DropdownMenuItem
            disabled={isPending}
            onSelect={(event) => {
              event.preventDefault();
              onForceLogout(user);
            }}
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
  );
}
