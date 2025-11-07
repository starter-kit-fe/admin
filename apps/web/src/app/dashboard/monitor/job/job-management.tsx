'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { toast } from 'sonner';
import { Clock, MoreHorizontal, Play, RefreshCcw, Trash2 } from 'lucide-react';

import { InlineLoading } from '@/components/loading';
import { PaginationToolbar } from '@/components/pagination/pagination-toolbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { DeleteConfirmDialog } from '../../system/user/components/delete-confirm-dialog';

import {
  changeJobStatus,
  deleteJob,
  listJobs,
  runJob,
  type JobListParams,
} from './api';
import type { Job } from './type';

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: '0', label: '正常' },
  { value: '1', label: '暂停' },
] as const;

const STATUS_BADGE_VARIANT: Record<string, 'secondary' | 'destructive' | 'outline'> = {
  '0': 'secondary',
  '1': 'outline',
};

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function resolveStatusLabel(status: string) {
  return status === '0' ? '正常' : '暂停';
}

function resolveMisfireLabel(policy: string) {
  switch (policy) {
    case '1':
      return '立即执行';
    case '2':
      return '执行一次';
    case '3':
    default:
      return '放弃执行';
  }
}

function resolveConcurrentLabel(flag: string) {
  return flag === '0' ? '允许' : '禁止';
}

interface DeleteState {
  open: boolean;
  job?: Job;
}

export function JobManagement() {
  const queryClient = useQueryClient();

  const [jobNameInput, setJobNameInput] = useState('');
  const [jobGroupInput, setJobGroupInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTER_OPTIONS)[number]['value']>('all');

  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);

  const [deleteState, setDeleteState] = useState<DeleteState>({ open: false });
  const [pendingRunId, setPendingRunId] = useState<number | null>(null);
  const [pendingStatusId, setPendingStatusId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const debouncedJobName = useDebouncedValue(jobNameInput.trim(), 250);
  const debouncedJobGroup = useDebouncedValue(jobGroupInput.trim(), 250);

  const queryParams: JobListParams = useMemo(() => {
    const params: JobListParams = {
      pageNum,
      pageSize,
    };

    if (debouncedJobName) {
      params.jobName = debouncedJobName;
    }
    if (debouncedJobGroup) {
      params.jobGroup = debouncedJobGroup;
    }
    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }

    return params;
  }, [pageNum, pageSize, debouncedJobName, debouncedJobGroup, statusFilter]);

  const query = useQuery({
    queryKey: ['monitor', 'jobs', queryParams],
    queryFn: () => listJobs(queryParams),
    placeholderData: keepPreviousData,
  });

  const jobs = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  useEffect(() => {
    setPageNum(1);
  }, [debouncedJobName, debouncedJobGroup, statusFilter]);

  const columnHelper = useMemo(() => createColumnHelper<Job>(), []);

  const runJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      await runJob(jobId);
      return jobId;
    },
    onMutate: (jobId) => setPendingRunId(jobId),
    onSuccess: () => {
      toast.success('任务已提交执行');
      void queryClient.invalidateQueries({ queryKey: ['monitor', 'jobs'] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '操作失败，请稍后重试';
      toast.error(message);
    },
    onSettled: () => setPendingRunId(null),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ jobId, nextStatus }: { jobId: number; nextStatus: string }) => {
      await changeJobStatus(jobId, nextStatus);
      return { jobId, nextStatus };
    },
    onMutate: ({ jobId }) => setPendingStatusId(jobId),
    onSuccess: ({ nextStatus }) => {
      toast.success(nextStatus === '0' ? '任务已恢复' : '任务已暂停');
      void queryClient.invalidateQueries({ queryKey: ['monitor', 'jobs'] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '更新任务状态失败，请稍后重试';
      toast.error(message);
    },
    onSettled: () => setPendingStatusId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: async (jobId: number) => {
      await deleteJob(jobId);
      return jobId;
    },
    onMutate: (jobId) => setPendingDeleteId(jobId),
    onSuccess: () => {
      toast.success('任务已删除');
      void queryClient.invalidateQueries({ queryKey: ['monitor', 'jobs'] });
      setDeleteState({ open: false });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '删除任务失败，请稍后重试';
      toast.error(message);
    },
    onSettled: () => setPendingDeleteId(null),
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor('jobName', {
        header: () => '任务名称',
        cell: ({ row }) => {
          const job = row.original;
          return (
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{job.jobName || '-'}</p>
              <p className="text-xs font-mono uppercase text-muted-foreground">{job.jobGroup || 'DEFAULT'}</p>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[200px]',
        },
      }),
      columnHelper.accessor('invokeTarget', {
        header: () => '调用目标',
        cell: ({ getValue }) => (
          <div className="max-w-[320px] truncate font-mono text-xs">{getValue()}</div>
        ),
        meta: {
          headerClassName: 'min-w-[280px]',
        },
      }),
      columnHelper.accessor('cronExpression', {
        header: () => 'Cron 表达式',
        cell: ({ row }) => {
          const job = row.original;
          return (
            <div className="space-y-1">
              <p className="font-mono text-xs text-foreground">{job.cronExpression || '-'}</p>
              <p className="text-xs text-muted-foreground">策略：{resolveMisfireLabel(job.misfirePolicy)}</p>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[220px]',
        },
      }),
      columnHelper.accessor('concurrent', {
        header: () => '并发',
        cell: ({ getValue }) => <span>{resolveConcurrentLabel(getValue() ?? '')}</span>,
        meta: {
          headerClassName: 'w-[80px]',
        },
      }),
      columnHelper.accessor('status', {
        header: () => '状态',
        cell: ({ getValue }) => {
          const status = getValue() ?? '1';
          return (
            <Badge variant={STATUS_BADGE_VARIANT[status] ?? 'outline'}>{resolveStatusLabel(status)}</Badge>
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
          headerClassName: 'min-w-[200px]',
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="block text-right">操作</span>,
        cell: ({ row }) => {
          const job = row.original;
          const jobId = job.jobId ?? 0;
          const isRunning = pendingRunId === jobId && runJobMutation.isPending;
          const isUpdatingStatus = pendingStatusId === jobId && statusMutation.isPending;

          const nextStatus = job.status === '0' ? '1' : '0';

          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    操作
                    <MoreHorizontal className="ml-1.5 size-4 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    disabled={isRunning}
                    onSelect={() => runJobMutation.mutate(jobId)}
                  >
                    {isRunning ? (
                      <>
                        <Spinner className="mr-2 size-4" />
                        触发中...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 size-4" />
                        触发一次
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={isUpdatingStatus}
                    onSelect={() => statusMutation.mutate({ jobId, nextStatus })}
                  >
                    {isUpdatingStatus ? (
                      <>
                        <Spinner className="mr-2 size-4" />
                        更新中...
                      </>
                    ) : (
                      <>
                        <Clock className="mr-2 size-4" />
                        {nextStatus === '0' ? '恢复任务' : '暂停任务'}
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() => setDeleteState({ open: true, job })}
                  >
                    <Trash2 className="mr-2 size-4" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        meta: {
          headerClassName: 'w-[120px] text-right',
          cellClassName: 'text-right',
        },
      }),
    ],
    [
      columnHelper,
      pendingRunId,
      runJobMutation.isPending,
      pendingStatusId,
      statusMutation.isPending,
    ],
  );

  const table = useReactTable({
    data: jobs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handlePageChange = (nextPage: number) => {
    setPageNum(nextPage);
  };

  const handlePageSizeChange = (nextSize: number) => {
    setPageSize(nextSize);
    setPageNum(1);
  };

  const isLoading = query.isLoading && jobs.length === 0;
  const isError = query.isError;
  const isRefetching = query.isRefetching;

  const visibleColumnCount = table.getVisibleLeafColumns().length || columns.length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl font-semibold text-foreground">定时任务</CardTitle>
              <CardDescription>查看并管理调度任务，支持按名称、分组与状态筛选。</CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => void query.refetch()}
              disabled={isLoading || isRefetching}
            >
              {isRefetching ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  刷新中
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 size-4" />
                  刷新
                </>
              )}
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="job-name">任务名称</Label>
              <Input
                id="job-name"
                placeholder="按名称筛选"
                value={jobNameInput}
                onChange={(event) => setJobNameInput(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="job-group">任务分组</Label>
              <Input
                id="job-group"
                placeholder="按分组筛选"
                value={jobGroupInput}
                onChange={(event) => setJobGroupInput(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>状态</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as (typeof STATUS_FILTER_OPTIONS)[number]['value'])}>
                <SelectTrigger>
                  <SelectValue placeholder="全部状态" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/40">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={cn(header.column.columnDef.meta?.headerClassName as string | undefined)}
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumnCount} className="h-32 text-center align-middle">
                      <InlineLoading label="正在加载任务..." />
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumnCount} className="h-24 text-center text-sm text-destructive">
                      加载失败，请稍后再试。
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumnCount} className="h-24 text-center text-sm text-muted-foreground">
                      暂无任务数据。
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="transition-colors hover:bg-muted/60">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn(cell.column.columnDef.meta?.cellClassName as string | undefined)}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!isLoading && !isError && total > 0 ? (
            <PaginationToolbar
              totalItems={total}
              currentPage={pageNum}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          ) : null}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteState.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteState({ open: false });
          }
        }}
        title="删除定时任务"
        description={
          deleteState.job
            ? `确定要删除任务“${deleteState.job.jobName}”吗？`
            : '确定要删除该任务吗？'
        }
        confirmLabel="删除任务"
        loading={deleteMutation.isPending && pendingDeleteId === (deleteState.job?.jobId ?? null)}
        onConfirm={() => {
          if (!deleteState.job || deleteMutation.isPending) {
            return;
          }
          deleteMutation.mutate(deleteState.job.jobId);
        }}
      />
    </div>
  );
}

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
  }
}
