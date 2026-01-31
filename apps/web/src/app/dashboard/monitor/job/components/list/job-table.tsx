'use client';

import { EllipsisText } from '@/components/table/ellipsis-text';
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
import { Spinner } from '@/components/ui/spinner';
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
import { Clock, Edit2, Eye, MoreHorizontal, Play, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { STATUS_BADGE_VARIANT } from '../../constants';
import type { Job } from '../../type';
import {
  resolveConcurrentLabel,
  resolveMisfireLabel,
  resolveStatusLabel,
} from '../../utils';

interface JobTableProps {
  rows: Job[];
  isLoading: boolean;
  isError: boolean;
  pendingRunId: number | null;
  pendingStatusId: number | null;
  onRunJob: (job: Job) => void;
  onToggleStatus: (id: number, nextStatus: string) => void;
  onDelete: (job: Job) => void;
  onEdit: (job: Job) => void;
}

export function JobTable({
  rows,
  isLoading,
  isError,
  pendingRunId,
  pendingStatusId,
  onRunJob,
  onToggleStatus,
  onDelete,
  onEdit,
}: JobTableProps) {
  const router = useRouter();
  const columnHelper = useMemo(() => createColumnHelper<Job>(), []);
  const { hasPermission } = usePermissions();
  const canRunJob = hasPermission('monitor:job:run');
  const canChangeStatus = hasPermission('monitor:job:changeStatus');
  const canDeleteJob = hasPermission('monitor:job:remove');
  const canViewDetail = hasPermission('monitor:job:query');
  const canEditJob = hasPermission('monitor:job:edit');
  const showActions =
    canRunJob || canChangeStatus || canDeleteJob || canViewDetail || canEditJob;

  const columns = useMemo(
    () => [
      columnHelper.accessor('jobName', {
        header: () => '任务名称',
        cell: ({ row }) => {
          const job = row.original;
          return (
            <div className="space-y-1">
              <EllipsisText
                value={job.jobName || '-'}
                className="max-w-[220px] text-sm font-medium text-foreground"
              />
              <EllipsisText
                value={job.jobGroup || 'DEFAULT'}
                className="max-w-[200px] text-xs font-mono uppercase text-muted-foreground"
              />
              {job.isRunning ? (
                <p className="flex items-center gap-1 text-[11px] text-emerald-600 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  执行中
                </p>
              ) : null}
            </div>
          );
        },
        meta: {
          headerClassName: 'w-[240px]',
          cellClassName: 'w-[240px] whitespace-nowrap pr-4',
        },
      }),
      columnHelper.accessor('cronExpression', {
        header: () => 'Cron 表达式',
        cell: ({ row }) => {
          const job = row.original;
          return (
            <div className="space-y-1">
              <EllipsisText
                value={job.cronExpression || '-'}
                className="max-w-[240px] font-mono text-xs text-foreground"
                tooltipClassName="text-left font-mono"
              />
              <EllipsisText
                value={`策略：${resolveMisfireLabel(job.misfirePolicy)}`}
                className="max-w-[240px] text-xs text-muted-foreground"
              />
            </div>
          );
        },
        meta: {
          headerClassName: 'w-[260px]',
          cellClassName: 'w-[260px] whitespace-nowrap pr-4',
        },
      }),
      columnHelper.accessor('concurrent', {
        header: () => '并发',
        cell: ({ getValue }) => (
          <span className="text-[12px]">
            {resolveConcurrentLabel(getValue())}
          </span>
        ),
        meta: {
          headerClassName: 'w-[120px]',
        },
      }),
      columnHelper.accessor('status', {
        header: () => '状态',
        cell: ({ getValue }) => {
          const status = getValue() ?? '1';
          return (
            <div className="flex flex-col items-start justify-start">
              <Badge variant={STATUS_BADGE_VARIANT[status] ?? 'outline'}>
                {resolveStatusLabel(status)}
              </Badge>
              {status === '0' ? (
                <span className="text-[11px] text-muted-foreground">
                  调度中
                </span>
              ) : null}
            </div>
          );
        },
        meta: {
          headerClassName: 'w-[110px]',
        },
      }),
      columnHelper.display({
        id: 'timestamps',
        header: () => '更新时间',
        cell: ({ row }) => {
          const job = row.original;
          return (
            <div className="space-y-1 text-xs text-muted-foreground">
              <EllipsisText
                value={`创建：${job.createdAt || '-'}`}
                className="max-w-[220px]"
              />
              <EllipsisText
                value={`更新：${job.updatedAt || '-'}`}
                className="max-w-[220px]"
              />
            </div>
          );
        },
        meta: {
          headerClassName: 'w-[220px]',
          cellClassName: 'w-[220px] whitespace-normal break-words',
        },
      }),
      ...(showActions
        ? [
            columnHelper.display({
              id: 'actions',
              header: () => <span className="block text-right">操作</span>,
              cell: ({ row }) => {
                const job = row.original;
                const id = job.id;
                const isRunPending = pendingRunId === id;
                const isUpdatingStatus = pendingStatusId === id;
                const nextStatus = job.status === '0' ? '1' : '0';
                const concurrencyLocked =
                  job.isRunning && job.concurrent === '1';

                return (
                  <div className="flex items-center justify-end">
                    <JobRowActions
                      job={job}
                      canViewDetail={canViewDetail}
                      canEdit={canEditJob}
                      canRun={canRunJob}
                      canChangeStatus={canChangeStatus}
                      canDelete={canDeleteJob}
                      isRunPending={isRunPending}
                      isUpdatingStatus={isUpdatingStatus}
                      concurrencyLocked={concurrencyLocked}
                      onViewDetail={() =>
                        router.push(`/dashboard/monitor/job/${id}`)
                      }
                      onEdit={() => onEdit(job)}
                      onRun={() => onRunJob(job)}
                      onToggleStatus={() => onToggleStatus(id, nextStatus)}
                      onDelete={() => onDelete(job)}
                    />
                  </div>
                );
              },
              meta: {
                ...PINNED_ACTION_COLUMN_META,
              },
            }),
          ]
        : []),
    ],
    [
      canChangeStatus,
      canDeleteJob,
      canEditJob,
      canRunJob,
      canViewDetail,
      columnHelper,
      onDelete,
      onEdit,
      onRunJob,
      onToggleStatus,
      pendingRunId,
      pendingStatusId,
      router,
      showActions,
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
    <div className="rounded-xl border border-border/60">
      <div className="w-full overflow-x-auto scrollbar-thin">
        <Table className={cn(PINNED_TABLE_CLASS, 'min-w-[1024px]')}>
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
                  加载失败，请稍后再试。
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
                      <EmptyTitle>暂无任务数据</EmptyTitle>
                      <EmptyDescription>
                        配置定时任务后可在此查看与管理。
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

function JobRowActions({
  job,
  canViewDetail,
  canEdit,
  canRun,
  canChangeStatus,
  canDelete,
  isRunPending,
  isUpdatingStatus,
  concurrencyLocked,
  onViewDetail,
  onEdit,
  onRun,
  onToggleStatus,
  onDelete,
}: {
  job: Job;
  canViewDetail: boolean;
  canEdit: boolean;
  canRun: boolean;
  canChangeStatus: boolean;
  canDelete: boolean;
  isRunPending: boolean;
  isUpdatingStatus: boolean;
  concurrencyLocked: boolean;
  onViewDetail: () => void;
  onEdit: () => void;
  onRun: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (!canViewDetail && !canEdit && !canRun && !canChangeStatus && !canDelete) {
    return null;
  }

  const nextStatusLabel = job.status === '0' ? '暂停任务' : '恢复任务';

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
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
            <SheetTitle>任务操作</SheetTitle>
            <SheetDescription>
              对「{job.jobName || '未命名任务'}」执行操作。
            </SheetDescription>
          </SheetHeader>
          <SheetFooter className="mt-0 flex-col gap-2 px-4 pb-4">
            {canViewDetail ? (
              <Button
                variant="secondary"
                className="w-full justify-between"
                onClick={() => {
                  onViewDetail();
                  setOpen(false);
                }}
              >
                <span className="flex items-center gap-2">
                  <Eye className="size-4" />
                  查看详情
                </span>
                <span className="text-xs text-muted-foreground">
                  跳转至任务详情
                </span>
              </Button>
            ) : null}
            {canEdit ? (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => {
                  onEdit();
                  setOpen(false);
                }}
              >
                <Edit2 className="size-4" />
                编辑任务
              </Button>
            ) : null}
            {canRun ? (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                disabled={isRunPending || concurrencyLocked}
                onClick={() => {
                  onRun();
                  setOpen(false);
                }}
              >
                {isRunPending ? (
                  <>
                    <Spinner className="size-4" />
                    触发中
                  </>
                ) : concurrencyLocked ? (
                  <>
                    <Spinner className="size-4" />
                    执行中
                  </>
                ) : (
                  <>
                    <Play className="size-4" />
                    立即执行
                  </>
                )}
              </Button>
            ) : null}
            {canChangeStatus ? (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                disabled={isUpdatingStatus}
                onClick={() => {
                  onToggleStatus();
                  setOpen(false);
                }}
              >
                {isUpdatingStatus ? (
                  <>
                    <Spinner className="size-4" />
                    更新中
                  </>
                ) : (
                  <>
                    <Clock className="size-4" />
                    {nextStatusLabel}
                  </>
                )}
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                variant="destructive"
                className="w-full justify-start gap-2"
                onClick={() => {
                  onDelete();
                  setOpen(false);
                }}
              >
                <Trash2 className="size-4" />
                删除任务
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
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          aria-label={`更多操作：${job.jobName}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {canViewDetail ? (
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              onViewDetail();
            }}
          >
            <Eye className="mr-2 size-4" />
            查看详情
          </DropdownMenuItem>
        ) : null}
        {canEdit ? (
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              onEdit();
            }}
          >
            <Edit2 className="mr-2 size-4" />
            编辑任务
          </DropdownMenuItem>
        ) : null}
        {canRun ? (
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              onRun();
            }}
            disabled={isRunPending || concurrencyLocked}
          >
            {isRunPending ? (
              <>
                <Spinner className="mr-2 size-3.5" />
                触发中
              </>
            ) : concurrencyLocked ? (
              <>
                <Spinner className="mr-2 size-3.5" />
                执行中
              </>
            ) : (
              <>
                <Play className="mr-2 size-4" />
                立即执行
              </>
            )}
          </DropdownMenuItem>
        ) : null}
        {canChangeStatus ? (
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              onToggleStatus();
            }}
            disabled={isUpdatingStatus}
          >
            {isUpdatingStatus ? (
              <>
                <Spinner className="mr-2 size-3.5" />
                更新中
              </>
            ) : (
              <>
                <Clock className="mr-2 size-4" />
                {nextStatusLabel}
              </>
            )}
          </DropdownMenuItem>
        ) : null}
        {canDelete ? (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={(event) => {
              event.preventDefault();
              onDelete();
            }}
          >
            <Trash2 className="mr-2 size-4" />
            删除任务
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
  }
}
