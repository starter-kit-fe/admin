'use client';

import { InlineLoading } from '@/components/loading';
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
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Clock, Edit2, MoreHorizontal, Play, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { STATUS_BADGE_VARIANT } from '../../constants';
import type { Job } from '../../type';
import {
  resolveConcurrentLabel,
  resolveMisfireLabel,
  resolveStatusLabel,
} from '../../utils';
import { usePermissions } from '@/hooks/use-permissions';

interface JobTableProps {
  rows: Job[];
  isLoading: boolean;
  isError: boolean;
  pendingRunId: number | null;
  pendingStatusId: number | null;
  onRunJob: (jobId: number) => void;
  onToggleStatus: (jobId: number, nextStatus: string) => void;
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
              <p className="text-sm font-medium text-foreground">
                {job.jobName || '-'}
              </p>
              <p className="text-xs font-mono uppercase text-muted-foreground">
                {job.jobGroup || 'DEFAULT'}
              </p>
            </div>
          );
        },
        meta: {
          headerClassName: 'w-[200px]',
          cellClassName: 'whitespace-nowrap pr-4',
        },
      }),
      columnHelper.accessor('invokeTarget', {
        header: () => '调用目标',
        cell: ({ getValue }) => {
          const target = getValue();
          if (!target) {
            return <span className="text-xs text-muted-foreground">-</span>;
          }
          return (
            <div className="max-w-[300px] overflow-x-auto scrollbar-thin">
              <span className="inline-block whitespace-nowrap text-xs font-mono text-foreground">
                {target}
              </span>
            </div>
          );
        },
        meta: {
          headerClassName: 'w-[300px]',
          cellClassName: 'pr-4',
        },
      }),
      columnHelper.accessor('cronExpression', {
        header: () => 'Cron 表达式',
        cell: ({ row }) => {
          const job = row.original;
          return (
            <div className="space-y-1">
              <p className="font-mono text-xs text-foreground">
                {job.cronExpression || '-'}
              </p>
              <p className="text-xs text-muted-foreground">
                策略：{resolveMisfireLabel(job.misfirePolicy)}
              </p>
            </div>
          );
        },
        meta: {
          headerClassName: 'w-[220px]',
          cellClassName: 'whitespace-nowrap pr-4',
        },
      }),
      columnHelper.accessor('concurrent', {
        header: () => '并发',
        cell: ({ getValue }) => (
          <span>{resolveConcurrentLabel(getValue())}</span>
        ),
        meta: {
          headerClassName: 'w-[80px]',
        },
      }),
      columnHelper.accessor('status', {
        header: () => '状态',
        cell: ({ getValue }) => {
          const status = getValue() ?? '1';
          return (
            <Badge variant={STATUS_BADGE_VARIANT[status] ?? 'outline'}>
              {resolveStatusLabel(status)}
            </Badge>
          );
        },
        meta: {
          headerClassName: 'w-[100px]',
        },
      }),
      columnHelper.display({
        id: 'timestamps',
        header: () => '更新时间',
        cell: ({ row }) => {
          const job = row.original;
          return (
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>创建：{job.createTime || '-'}</p>
              <p>更新：{job.updateTime || '-'}</p>
            </div>
          );
        },
        meta: {
          headerClassName: 'w-[180px]',
          cellClassName: 'whitespace-nowrap',
        },
      }),
      ...(showActions
        ? [
          columnHelper.display({
            id: 'actions',
            header: () => <span className="block text-right">操作</span>,
            cell: ({ row }) => {
              const job = row.original;
              const jobId = job.jobId;
              const isRunning = pendingRunId === jobId;
              const isUpdatingStatus = pendingStatusId === jobId;
              const nextStatus = job.status === '0' ? '1' : '0';

              return (
                <div className="flex justify-end">
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
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
                            router.push(`/dashboard/monitor/job/${jobId}`);
                          }}
                        >
                          查看详情
                        </DropdownMenuItem>
                      ) : null}
                      {canEditJob ? (
                        <DropdownMenuItem
                          onSelect={(event) => {
                            event.preventDefault();
                            onEdit(job);
                          }}
                        >
                          <Edit2 className="mr-2 size-4" />
                          编辑任务
                        </DropdownMenuItem>
                      ) : null}
                      {canRunJob ? (
                        <DropdownMenuItem
                          onSelect={(event) => {
                            event.preventDefault();
                            onRunJob(jobId);
                          }}
                          disabled={isRunning}
                        >
                          {isRunning ? (
                            <>
                              <Spinner className="mr-2 size-3.5" />
                              触发中
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 size-4" />
                              立即触发
                            </>
                          )}
                        </DropdownMenuItem>
                      ) : null}
                      {canChangeStatus ? (
                        <DropdownMenuItem
                          onSelect={(event) => {
                            event.preventDefault();
                            onToggleStatus(jobId, nextStatus);
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
                              {nextStatus === '0' ? '恢复任务' : '暂停任务'}
                            </>
                          )}
                        </DropdownMenuItem>
                      ) : null}
                      {canDeleteJob ? (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={(event) => {
                            event.preventDefault();
                            onDelete(job);
                          }}
                        >
                          <Trash2 className="mr-2 size-4" />
                          删除任务
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            },
            meta: {
              headerClassName:
                'sticky right-0 z-20 w-[100px] bg-card/95 backdrop-blur-md text-right border-l border-border/60 shadow-[inset_4px_0_8px_-4px_rgba(0,0,0,0.1)]',
              cellClassName:
                'sticky right-0 z-10 w-[100px] bg-card/80 backdrop-blur-md text-right border-l border-border/60 group-hover:bg-muted/50 shadow-[inset_4px_0_8px_-4px_rgba(0,0,0,0.1)]',
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
        <Table className="w-full">
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
                  <InlineLoading label="正在加载任务..." />
                </TableCell>
              </TableRow>
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


declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
  }
}
