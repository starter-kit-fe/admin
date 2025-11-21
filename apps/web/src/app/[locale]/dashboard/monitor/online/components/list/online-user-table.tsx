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
import { TableLoadingSkeleton } from '@/components/table/table-loading-skeleton';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('OnlineUserManagement');
  const columnHelper = useMemo(() => createColumnHelper<OnlineUser>(), []);

  const columns = useMemo(() => {
    const baseColumns = [
      columnHelper.accessor('userName', {
        header: () => t('table.columns.account'),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="space-y-1">
              <EllipsisText
                value={user.userName || t('table.defaultUser')}
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
        header: () => t('table.columns.ip'),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="space-y-1">
              <EllipsisText
                value={user.ipaddr || '-'}
                className="max-w-[200px] text-sm text-foreground"
              />
              <EllipsisText
                value={user.loginLocation || t('table.rows.unknownLocation')}
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
        header: () => t('table.columns.client'),
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
        header: () => t('table.columns.status'),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <Badge variant={resolveStatusBadgeVariant(user.status)}>
              {user.status === '0' || !user.status
                ? t('status.online')
                : t('status.abnormal')}
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
        header: () => t('table.columns.loginTime'),
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
                  value={t('table.rows.lastActive', {
                    time: user.lastAccessTime,
                  })}
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
          header: () => (
            <span className="block text-right">{t('table.columns.actions')}</span>
          ),
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
                aria-label={t('table.selection.all')}
                checked={checkedState}
                onCheckedChange={(checked) =>
                  table.toggleAllPageRowsSelected(checked === true)
                }
              />
            );
          },
          cell: ({ row }) => (
            <Checkbox
              aria-label={t('table.selection.user', {
                name: row.original.userName || t('table.defaultUser'),
              })}
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
    t,
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
                {t('table.state.error')}
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
                    <EmptyTitle>{t('table.state.emptyTitle')}</EmptyTitle>
                    <EmptyDescription>
                      {t('table.state.emptyDescription')}
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
  const t = useTranslations('OnlineUserManagement');
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
            aria-label={t('table.actions.more')}
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
            <SheetTitle>{t('table.columns.actions')}</SheetTitle>
            <SheetDescription>{t('table.actions.more')}</SheetDescription>
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
                  {t('table.actions.view')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t('detail.description.generic')}
                </span>
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
                    {t('table.actions.pending')}
                  </>
                ) : (
                  <>
                    <LogOut className="size-4" />
                    {t('table.actions.force')}
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
          aria-label={t('table.actions.more')}
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
            {t('table.actions.view')}
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
                {t('table.actions.pending')}
              </>
            ) : (
              <>
                <LogOut className="mr-2 size-4" />
                {t('table.actions.force')}
              </>
            )}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
