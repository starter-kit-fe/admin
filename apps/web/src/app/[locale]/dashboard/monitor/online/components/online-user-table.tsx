'use client';

import { useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type RowSelectionState,
} from '@tanstack/react-table';
import { Eye, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
  const tTable = useTranslations('OnlineUserManagement.table');
  const tStatus = useTranslations('OnlineUserManagement.status');
  const defaultUserLabel = tTable('defaultUser');

  const columns = useMemo(() => {
    const baseColumns = [
      columnHelper.accessor('userName', {
        header: () => tTable('columns.account'),
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
        header: () => tTable('columns.ip'),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="space-y-1">
              <p className="text-sm text-foreground">{user.ipaddr || '-'}</p>
              <p className="text-xs text-muted-foreground">
                {user.loginLocation || tTable('rows.unknownLocation')}
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
        header: () => tTable('columns.client'),
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
        header: () => tTable('columns.status'),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <Badge variant={resolveStatusBadgeVariant(user.status)}>
              {user.status === '0' || !user.status
                ? tStatus('online')
                : tStatus('abnormal')}
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
        header: () => tTable('columns.loginTime'),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="space-y-1">
              <p className="text-sm text-foreground">
                {user.loginTime || '-'}
              </p>
              {user.lastAccessTime ? (
                <p className="text-xs text-muted-foreground">
                  {tTable('rows.lastActive', { time: user.lastAccessTime })}
                </p>
              ) : null}
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[180px]',
        },
      }),
    ];

    if (canForceLogout || canViewDetail) {
      baseColumns.push(
        columnHelper.display({
          id: 'actions',
          header: () => (
            <span className="block text-right">{tTable('columns.actions')}</span>
          ),
          cell: ({ row }) => {
            const user = row.original;
            const rowId = row.id;
            const isPending =
              canForceLogout &&
              isForceMutating &&
              pendingForceRowId === rowId;

            return (
              <div className="flex justify-end gap-2">
                {canViewDetail ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-sm font-medium"
                    onClick={(event) => {
                      event.stopPropagation();
                      onViewDetail(user);
                    }}
                  >
                    <Eye className="mr-1.5 size-3.5" />
                    {tTable('actions.view')}
                  </Button>
                ) : null}
                {canForceLogout ? (
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
                        {tTable('actions.pending')}
                      </>
                    ) : (
                      <>
                        <LogOut className="mr-1.5 size-3.5" />
                        {tTable('actions.force')}
                      </>
                    )}
                  </Button>
                ) : null}
              </div>
            );
          },
          enableSorting: false,
          meta: {
            headerClassName: 'w-[120px] text-right',
            cellClassName: 'text-right',
          },
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
                aria-label={tTable('selection.all')}
                checked={checkedState}
                onCheckedChange={(checked) =>
                  table.toggleAllPageRowsSelected(checked === true)
                }
              />
            );
          },
          cell: ({ row }) => (
            <Checkbox
              aria-label={tTable('selection.user', {
                name: row.original.userName || defaultUserLabel,
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
    defaultUserLabel,
    isForceMutating,
    onForceLogout,
    onViewDetail,
    pendingForceRowId,
    tStatus,
    tTable,
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
                  <InlineLoading label={tTable('state.loading')} />
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnCount}
                  className="h-24 text-center text-sm text-destructive"
                >
                  {tTable('state.error')}
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
                      <EmptyTitle>{tTable('state.emptyTitle')}</EmptyTitle>
                      <EmptyDescription>
                        {tTable('state.emptyDescription')}
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
