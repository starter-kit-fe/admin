'use client';

import { EllipsisText } from '@/components/table/ellipsis-text';
import {
  PINNED_ACTION_COLUMN_META,
  PINNED_TABLE_CLASS,
} from '@/components/table/pinned-actions';
import { TableLoadingSkeleton } from '@/components/table/table-loading-skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@repo/ui/components/empty';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@repo/ui/components/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { type Locale, format, formatDistanceToNow } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import type { LoginLog } from '../../type';

interface LoginLogTableProps {
  rows: LoginLog[];
  isLoading?: boolean;
  isError?: boolean;
  onDelete: (log: LoginLog) => void;
}

interface RowActionsProps {
  log: LoginLog;
  onDelete: (log: LoginLog) => void;
}

function RowActions({ log, onDelete }: RowActionsProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const t = useTranslations('LoginLogManagement');

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
      <DropdownMenuContent align="end" className="w-36">
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

function formatRelativeDate(
  value: string | null | undefined,
  dateFnsLocale: Locale,
): { relative: string; absolute: string } | null {
  if (!value) return null;
  try {
    const date = new Date(value);
    return {
      relative: formatDistanceToNow(date, {
        addSuffix: true,
        locale: dateFnsLocale,
      }),
      absolute: format(date, 'yyyy-MM-dd HH:mm:ss'),
    };
  } catch {
    return null;
  }
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
  const t = useTranslations('LoginLogManagement');
  const locale = useLocale();
  const dateFnsLocale = locale === 'zh-Hans' ? zhCN : enUS;

  const columns = useMemo(
    () => [
      columnHelper.accessor('userName', {
        header: () => t('table.columns.account'),
        cell: ({ getValue }) => (
          <span className="text-sm font-medium text-foreground">
            {getValue() || '—'}
          </span>
        ),
        meta: {
          headerClassName: 'w-[140px]',
        },
      }),
      columnHelper.accessor('ipaddr', {
        header: () => t('table.columns.ip'),
        cell: ({ row }) => {
          const log = row.original;
          return (
            <div className="space-y-0.5">
              <p className="font-mono text-sm text-foreground">
                {log.ipaddr || '—'}
              </p>
              {log.loginLocation ? (
                <p className="text-xs text-muted-foreground">
                  {log.loginLocation}
                </p>
              ) : null}
            </div>
          );
        },
        meta: {
          headerClassName: 'w-[180px]',
        },
      }),
      columnHelper.display({
        id: 'client',
        header: () => t('table.columns.client'),
        cell: ({ row }) => {
          const log = row.original;
          return (
            <div className="space-y-0.5">
              <p className="text-sm text-foreground">{log.browser || '—'}</p>
              <p className="text-xs text-muted-foreground">{log.os || '—'}</p>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[160px]',
        },
      }),
      columnHelper.accessor('status', {
        header: () => t('table.columns.status'),
        cell: ({ getValue }) => {
          const isSuccess = getValue() === '0';
          return (
            <Badge
              variant={isSuccess ? 'outline' : 'destructive'}
              className={
                isSuccess
                  ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400'
                  : undefined
              }
            >
              {isSuccess ? t('status.success') : t('status.failed')}
            </Badge>
          );
        },
        meta: {
          headerClassName: 'w-[100px]',
        },
      }),
      columnHelper.accessor('msg', {
        header: () => t('table.columns.message'),
        cell: ({ getValue }) => <EllipsisText value={getValue()} />,
        meta: {
          headerClassName: 'min-w-[200px]',
          cellClassName: 'max-w-[300px]',
        },
      }),
      columnHelper.accessor('createdAt', {
        header: () => t('table.columns.time'),
        cell: ({ getValue }) => {
          const formatted = formatRelativeDate(getValue(), dateFnsLocale);
          if (!formatted)
            return <span className="text-muted-foreground">—</span>;
          return (
            <span
              className="text-sm tabular-nums text-foreground"
              title={formatted.absolute}
            >
              {formatted.relative}
            </span>
          );
        },
        meta: {
          headerClassName: 'w-[140px]',
        },
      }),
      ...(canDeleteLog
        ? [
            columnHelper.display({
              id: 'actions',
              header: () => (
                <div className="text-right">{t('table.columns.actions')}</div>
              ),
              cell: ({ row }) => (
                <div className="flex justify-end">
                  <RowActions log={row.original} onDelete={onDelete} />
                </div>
              ),
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
    [canDeleteLog, columnHelper, dateFnsLocale, onDelete, t],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const visibleColumnCount =
    table.getVisibleLeafColumns().length || columns.length;

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="w-full overflow-x-auto">
        <Table
          className={cn(PINNED_TABLE_CLASS, 'min-w-[900px] md:table-fixed')}
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
