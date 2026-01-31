'use client';

import {
  PINNED_ACTION_COLUMN_META,
  PINNED_TABLE_CLASS,
} from '@/components/table/pinned-actions';
import { TableLoadingSkeleton } from '@/components/table/table-loading-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';

import type { OperLog } from '../../type';
import { getOperLogStatusBadgeVariant } from '../../utils';

interface RowActionsProps {
  log: OperLog;
  onDelete: (log: OperLog) => void;
}

function RowActions({ log, onDelete }: RowActionsProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const t = useTranslations('OperLogManagement');

  const handleDelete = () => {
    onDelete(log);
    setOpen(false);
  };

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-7 sm:size-8"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            aria-label={t('table.actions.more')}
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
            <SheetDescription>
              {t('table.actions.sheetDescription')}
            </SheetDescription>
          </SheetHeader>
          <SheetFooter className="mt-0 flex-col gap-2 px-4 pb-4">
            <Button
              variant="destructive"
              className="w-full justify-start gap-2"
              onClick={handleDelete}
            >
              <Trash2 className="size-4" />
              {t('table.actions.delete')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-7 sm:size-8"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          aria-label={t('table.actions.more')}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-28">
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={(event) => {
            event.preventDefault();
            handleDelete();
          }}
        >
          <Trash2 className="mr-2 size-4" />
          {t('table.actions.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
  const t = useTranslations('OperLogManagement');

  const getStatusLabel = useCallback(
    (status?: number | string | null) => {
      const key = String(status) === '0' ? '0' : '1';
      return t(`status.${key}`);
    },
    [t],
  );

  const getBusinessTypeLabel = useCallback(
    (value?: number | string | null) => {
      const key = value === null || value === undefined ? '0' : String(value);
      return t(`businessTypes.${key}`);
    },
    [t],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: () => t('table.columns.title'),
        cell: ({ row }) => {
          const log = row.original;
          return (
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {log.title || '-'}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('table.cells.department', {
                  value: log.deptName || t('table.cells.departmentFallback'),
                })}
              </p>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[220px]',
          cellClassName: 'min-w-[220px]',
        },
      }),
      columnHelper.accessor('businessType', {
        header: () => t('table.columns.businessType'),
        cell: ({ getValue }) => (
          <Badge variant="secondary" className="rounded-full px-2 py-0.5">
            {getBusinessTypeLabel(getValue())}
          </Badge>
        ),
        meta: {
          headerClassName: 'w-[132px]',
          cellClassName: 'w-[132px]',
        },
      }),
      columnHelper.accessor('status', {
        header: () => t('table.columns.status'),
        cell: ({ getValue }) => (
          <Badge variant={getOperLogStatusBadgeVariant(getValue())}>
            {getStatusLabel(getValue())}
          </Badge>
        ),
        meta: {
          headerClassName: 'w-[120px]',
          cellClassName: 'w-[120px]',
        },
      }),
      columnHelper.accessor('requestMethod', {
        header: () => t('table.columns.requestMethod'),
        cell: ({ getValue }) => (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-mono uppercase text-foreground/80">
            {getValue() || '-'}
          </span>
        ),
        meta: {
          headerClassName: 'w-[136px]',
          cellClassName: 'w-[136px]',
        },
      }),
      columnHelper.display({
        id: 'operator',
        header: () => t('table.columns.operator'),
        cell: ({ row }) => {
          const log = row.original;
          return (
            <div className="space-y-1">
              <p className="text-sm text-foreground">{log.operName || '-'}</p>
              {log.operIp ? (
                <p className="text-xs text-muted-foreground">
                  {t('table.cells.ip', { value: log.operIp })}
                </p>
              ) : null}
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[180px]',
          cellClassName: 'min-w-[180px]',
        },
      }),
      columnHelper.accessor('operUrl', {
        header: () => t('table.columns.operUrl'),
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
          headerClassName: 'min-w-[280px]',
          cellClassName: 'min-w-[280px] max-w-[360px]',
        },
      }),
      columnHelper.accessor('createdAt', {
        header: () => t('table.columns.operTime'),
        cell: ({ row }) => {
          const log = row.original;
          return (
            <div className="space-y-1 text-sm text-foreground">
              <p>{log.createdAt || '-'}</p>
              {log.costTime ? (
                <p className="text-xs text-muted-foreground">
                  {t('table.cells.cost', { value: log.costTime })}
                </p>
              ) : null}
            </div>
          );
        },
        meta: {
          headerClassName: 'w-[172px]',
          cellClassName: 'w-[172px]',
        },
      }),
      ...(canDeleteOperLog
        ? [
            columnHelper.display({
              id: 'actions',
              header: () => (
                <div className="text-right">{t('table.columns.actions')}</div>
              ),
              cell: ({ row }) => {
                const log = row.original;
                return (
                  <div className="flex justify-end">
                    <RowActions log={log} onDelete={onDelete} />
                  </div>
                );
              },
              meta: {
                ...PINNED_ACTION_COLUMN_META,
                headerClassName:
                  'sticky right-0 z-20 w-[76px] bg-card text-right',
                cellClassName:
                  'sticky right-0 z-10 w-[76px] bg-card text-right group-hover:bg-muted/50',
              },
            }),
          ]
        : []),
    ],
    [
      canDeleteOperLog,
      columnHelper,
      getBusinessTypeLabel,
      getStatusLabel,
      onDelete,
      t,
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
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="w-full overflow-x-auto">
        <Table
          className={cn(PINNED_TABLE_CLASS, 'min-w-[800px] md:table-fixed')}
        >
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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="group transition-colors hover:bg-muted/60"
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
