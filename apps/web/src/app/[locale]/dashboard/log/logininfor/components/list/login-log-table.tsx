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
import { getLoginStatusBadgeVariant } from '../../utils';
import { usePermissions } from '@/hooks/use-permissions';
import { useTranslations } from 'next-intl';

interface LoginLogTableProps {
  rows: LoginLog[];
  isLoading?: boolean;
  isError?: boolean;
  onDelete: (log: LoginLog) => void;
}

export function LoginLogTable({
  rows,
  isLoading = false,
  isError = false,
  onDelete,
}: LoginLogTableProps) {
  const columnHelper = useMemo(() => createColumnHelper<LoginLog>(), []);
  const { hasPermission } = usePermissions();
  const canDeleteLog = hasPermission('monitor:logininfor:remove');
  const tColumns = useTranslations('LoginLogManagement.table.columns');
  const tTable = useTranslations('LoginLogManagement.table');
  const tState = useTranslations('LoginLogManagement.table.state');
  const tStatus = useTranslations('LoginLogManagement.status');
  const tActions = useTranslations('LoginLogManagement.table.actions');

  const columns = useMemo(
    () => [
      columnHelper.accessor('userName', {
        header: () => tColumns('account'),
        cell: ({ row }) => {
          const log = row.original;
          const locationText =
            log.loginLocation || tTable('locationUnknown');
          return (
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {log.userName || '-'}
              </p>
              <p className="text-xs text-muted-foreground">
                {tTable('locationLabel', { location: locationText })}
              </p>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[200px]',
        },
      }),
      columnHelper.accessor('ipaddr', {
        header: () => tColumns('ip'),
        cell: ({ getValue }) => (
          <span className="text-sm text-foreground">{getValue() || '-'}</span>
        ),
        meta: {
          headerClassName: 'w-[160px]',
        },
      }),
      columnHelper.display({
        id: 'client',
        header: () => tColumns('client'),
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
        header: () => tColumns('status'),
        cell: ({ getValue }) => {
          const status = getValue();
          const label =
            status === '0' ? tStatus('success') : tStatus('failed');
          return (
            <Badge variant={getLoginStatusBadgeVariant(status)}>
              {label}
            </Badge>
          );
        },
        meta: {
          headerClassName: 'w-[120px]',
        },
      }),
      columnHelper.accessor('msg', {
        header: () => tColumns('message'),
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
        header: () => tColumns('time'),
        cell: ({ getValue }) => (
          <span className="text-sm text-foreground">{getValue() ?? '-'}</span>
        ),
        meta: {
          headerClassName: 'w-[160px]',
        },
      }),
      ...(canDeleteLog
        ? [
            columnHelper.display({
              id: 'actions',
              header: () => (
                <div className="text-right">{tColumns('actions')}</div>
              ),
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
                      <span className="sr-only">{tActions('delete')}</span>
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
    [canDeleteLog, columnHelper, onDelete, tActions, tColumns, tStatus, tTable],
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
                  <InlineLoading label={tState('loading')} />
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnCount}
                  className="h-24 text-center text-sm text-destructive"
                >
                  {tState('error')}
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
                      <EmptyTitle>{tState('emptyTitle')}</EmptyTitle>
                      <EmptyDescription>
                        {tState('emptyDescription')}
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
