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
import { OPER_LOG_REQUEST_METHOD_OPTIONS } from '../../constants';
import { getOperLogStatusBadgeVariant } from '../../utils';
import { usePermissions } from '@/hooks/use-permissions';
import { useTranslations } from 'next-intl';

interface OperLogTableProps {
  rows: OperLog[];
  onDelete: (log: OperLog) => void;
  isLoading: boolean;
  isError: boolean;
}

type RequestMethod =
  (typeof OPER_LOG_REQUEST_METHOD_OPTIONS)[number]['value'];

const KNOWN_REQUEST_METHODS = new Set<RequestMethod>(
  OPER_LOG_REQUEST_METHOD_OPTIONS.map((option) => option.value),
);

function isKnownRequestMethod(value: string): value is RequestMethod {
  return KNOWN_REQUEST_METHODS.has(value as RequestMethod);
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
  const tColumns = useTranslations('OperLogManagement.table.columns');
  const tCells = useTranslations('OperLogManagement.table.cells');
  const tStatus = useTranslations('OperLogManagement.status');
  const tBusinessTypes = useTranslations('OperLogManagement.businessTypes');
  const tRequestMethods = useTranslations('OperLogManagement.requestMethods');
  const tState = useTranslations('OperLogManagement.table.state');
  const tActions = useTranslations('OperLogManagement.table.actions');

  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: () => tColumns('title'),
        cell: ({ row }) => {
          const log = row.original;
          const deptName =
            log.deptName?.trim() || tCells('departmentFallback');
          return (
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {log.title || '-'}
              </p>
              <p className="text-xs text-muted-foreground">
                {tCells('department', { value: deptName })}
              </p>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[200px]',
        },
      }),
      columnHelper.accessor('businessType', {
        header: () => tColumns('businessType'),
        cell: ({ getValue }) => {
          const value = getValue();
          const label = tBusinessTypes(
            value === null || value === undefined
              ? '0'
              : String(value),
          );
          return (
            <Badge variant="secondary" className="rounded-full px-2 py-0.5">
              {label}
            </Badge>
          );
        },
        meta: {
          headerClassName: 'w-[120px]',
        },
      }),
      columnHelper.accessor('status', {
        header: () => tColumns('status'),
        cell: ({ getValue }) => {
          const value = getValue();
          const statusKey = String(value) === '0' ? '0' : '1';
          return (
            <Badge variant={getOperLogStatusBadgeVariant(value)}>
              {tStatus(statusKey)}
            </Badge>
          );
        },
        meta: {
          headerClassName: 'w-[120px]',
        },
      }),
      columnHelper.accessor('requestMethod', {
        header: () => tColumns('requestMethod'),
        cell: ({ getValue }) => {
          const raw = getValue();
          const method = raw ? String(raw) : '';
          const methodKey = method && isKnownRequestMethod(method) ? method : null;
          const label = methodKey ? tRequestMethods(methodKey) : method || '-';
          return (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-mono uppercase text-foreground/80">
              {label}
            </span>
          );
        },
        meta: {
          headerClassName: 'w-[140px]',
        },
      }),
      columnHelper.display({
        id: 'operator',
        header: () => tColumns('operator'),
        cell: ({ row }) => {
          const log = row.original;
          return (
            <div className="space-y-1">
              <p className="text-sm text-foreground">{log.operName || '-'}</p>
              {log.operIp ? (
                <p className="text-xs text-muted-foreground">
                  {tCells('ip', { value: log.operIp })}
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
        header: () => tColumns('operUrl'),
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
        header: () => tColumns('operTime'),
        cell: ({ row }) => {
          const log = row.original;
          return (
            <div className="space-y-1 text-sm text-foreground">
              <p>{log.operTime || '-'}</p>
              {log.costTime ? (
                <p className="text-xs text-muted-foreground">
                  {tCells('cost', { value: log.costTime })}
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
    [
      canDeleteOperLog,
      columnHelper,
      onDelete,
      tBusinessTypes,
      tCells,
      tColumns,
      tRequestMethods,
      tStatus,
      tActions,
    ],
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
