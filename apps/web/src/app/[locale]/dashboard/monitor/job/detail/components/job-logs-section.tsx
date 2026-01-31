import { PaginationToolbar } from '@/components/pagination/pagination-toolbar';
import { EllipsisText } from '@/components/table/ellipsis-text';
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
  Sheet,
  SheetContent,
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
import { cn } from '@/lib/utils';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Activity, Eye, Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
import { useMemo } from 'react';

import type { Job, JobLog, JobLogList } from '../../type';
import { getLogStatusMeta } from './log-meta';
import { AwaitingExecutionState } from './log-states';

const LOG_PAGE_SIZES = [5, 10, 20];

export function JobLogsSection({
  job,
  logs,
  isLoading,
  upcomingExecutions,
  cronDescription,
  onPageChange,
  onPageSizeChange,
  onSelectLog,
  onClearLogs,
  canClearLogs,
  clearing,
  t,
}: {
  job: Job;
  logs?: JobLogList;
  isLoading?: boolean;
  upcomingExecutions: string[];
  cronDescription: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSelectLog: (log: JobLog) => void;
  onClearLogs: () => void;
  canClearLogs: boolean;
  clearing: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const rows = logs?.list ?? [];
  const total = logs?.total ?? 0;
  const showSkeleton = isLoading && rows.length === 0;

  type JobLogColumnDef = ColumnDef<JobLog> & {
    meta?: {
      headerClassName?: string;
      cellClassName?: string;
    };
  };

  const columns = useMemo<JobLogColumnDef[]>(
    () => [
      {
        id: 'time',
        header: t('detail.logs.table.time'),
        cell: ({ row }) => {
          const log = row.original;
          return (
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {log.createdAt || '—'}
              </p>
              <p className="text-xs text-muted-foreground">
                {log.invokeTarget || job.invokeTarget}
              </p>
            </div>
          );
        },
        meta: { headerClassName: 'w-[200px] px-3', cellClassName: 'px-3' },
      },
      {
        id: 'status',
        header: t('detail.logs.table.status'),
        cell: ({ row }) => {
          const meta = getLogStatusMeta(row.original.status, t);
          return (
            <Badge variant={meta.badge} className="px-2">
              {meta.label}
            </Badge>
          );
        },
        meta: {
          headerClassName: 'w-[140px] px-3',
          cellClassName: 'px-3 align-middle',
        },
      },
      {
        id: 'message',
        header: t('detail.logs.table.message'),
        cell: ({ row }) => (
          <EllipsisText
            value={row.original.jobMessage || '—'}
            className="max-w-[360px] text-sm text-foreground"
            tooltipClassName="text-left"
          />
        ),
        meta: { headerClassName: 'px-3', cellClassName: 'px-3 align-middle' },
      },
      {
        id: 'actions',
        header: () => (
          <span className="">{t('detail.logs.table.actions')}</span>
        ),
        cell: ({ row }) => (
          <LogRowActions
            log={row.original}
            onView={() => onSelectLog(row.original)}
            t={t}
          />
        ),
        meta: {
          headerClassName:
            'sticky right-0 z-10 w-[52px] px-2 text-right bg-card shadow-[inset_1px_0_0_theme(colors.border/70)]',
          cellClassName:
            'sticky right-0 z-10 w-[52px] px-2 text-right align-middle bg-card shadow-[inset_1px_0_0_theme(colors.border/70)]',
        },
      },
    ],
    [job.invokeTarget, onSelectLog, t],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
  });

  const columnCount = columns.length;
  const hasRows = table.getRowModel().rows.length > 0;
  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Activity className="size-4 text-muted-foreground" />
          {t('detail.logs.title')}
          <Badge variant="outline" className="ml-1">
            {t('detail.logs.count', { count: total })}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {canClearLogs ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearLogs}
              disabled={clearing || isLoading}
            >
              {clearing ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 size-4" />
              )}
              {clearing ? t('detail.logs.clearing') : t('detail.logs.clear')}
            </Button>
          ) : null}
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table className="min-w-[880px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'text-sm font-medium',
                      (header.column.columnDef as JobLogColumnDef).meta
                        ?.headerClassName,
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
            {showSkeleton ? (
              <TableLoadingSkeleton columns={columnCount} />
            ) : !hasRows ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="h-52 align-middle">
                  <AwaitingExecutionState
                    jobStatus={job.status}
                    upcomingExecutions={upcomingExecutions}
                    cronDescription={cronDescription}
                    t={t}
                  />
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
                        'align-middle',
                        (cell.column.columnDef as JobLogColumnDef).meta
                          ?.cellClassName,
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
      {logs ? (
        <div className="border-t border-border/60 px-3 py-2">
          <PaginationToolbar
            totalItems={logs.total}
            currentPage={logs.pageNum}
            pageSize={logs.pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            pageSizeOptions={LOG_PAGE_SIZES}
            disabled={isLoading}
            className="justify-end"
          />
        </div>
      ) : null}
    </div>
  );
}

function LogRowActions({
  log,
  onView,
  t,
}: {
  log: JobLog;
  onView: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
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
            <SheetTitle>{t('detail.logs.table.sheetTitle')}</SheetTitle>
          </SheetHeader>
          <SheetFooter className="mt-0 flex-col gap-2 px-4 pb-4">
            <Button
              variant="secondary"
              className="w-full justify-start gap-2"
              onClick={() => {
                onView();
              }}
            >
              <Eye className="size-4" />
              {t('detail.logs.table.view')}
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
          className="text-muted-foreground"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            onView();
          }}
        >
          <Eye className="mr-2 size-4" />
          {t('detail.logs.table.view')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
