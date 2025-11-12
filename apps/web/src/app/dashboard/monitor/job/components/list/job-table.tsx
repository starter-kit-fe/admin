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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { Clock, MoreHorizontal, Play, Trash2 } from 'lucide-react';
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';

import { STATUS_BADGE_VARIANT } from '../../constants';
import type { Job } from '../../type';
import {
  resolveConcurrentLabel,
  resolveMisfireLabel,
  resolveStatusLabel,
} from '../../utils';

function PinnedColumnShade() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 -left-3 w-3 bg-gradient-to-r from-slate-950/25 via-slate-950/10 to-transparent"
    />
  );
}

interface JobTableProps {
  rows: Job[];
  isLoading: boolean;
  isError: boolean;
  pendingRunId: number | null;
  pendingStatusId: number | null;
  onRunJob: (jobId: number) => void;
  onToggleStatus: (jobId: number, nextStatus: string) => void;
  onDelete: (job: Job) => void;
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
}: JobTableProps) {
  const columnHelper = useMemo(() => createColumnHelper<Job>(), []);

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
          headerClassName: 'min-w-[200px]',
        },
      }),
      columnHelper.accessor('invokeTarget', {
        header: () => '调用目标',
        cell: ({ getValue }) => {
          const target = getValue();
          if (!target) {
            return <span className="text-xs text-muted-foreground">-</span>;
          }
          return <InvokeTargetValue value={target} />;
        },
        meta: {
          headerClassName: 'w-[320px]',
          cellClassName: 'w-[320px]',
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
          headerClassName: 'min-w-[220px]',
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
          headerClassName: 'min-w-[200px]',
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: () => (
          <div className="relative flex justify-end">
            <PinnedColumnShade />
            <span>操作</span>
          </div>
        ),
        cell: ({ row }) => {
          const job = row.original;
          const jobId = job.jobId;
          const isRunning = pendingRunId === jobId;
          const isUpdatingStatus = pendingStatusId === jobId;
          const nextStatus = job.status === '0' ? '1' : '0';

          return (
            <div className="relative flex justify-end">
              <PinnedColumnShade />
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
                    onSelect={() => onRunJob(jobId)}
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
                    onSelect={() => onToggleStatus(jobId, nextStatus)}
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
                    onSelect={() => onDelete(job)}
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
          headerClassName:
            'sticky right-0 z-20 w-[120px] bg-card text-right border-l border-border/60 overflow-visible',
          cellClassName:
            'sticky right-0 z-10 w-[120px] bg-card text-right border-l border-border/60 overflow-visible group-hover:bg-muted/60',
        },
      }),
    ],
    [
      columnHelper,
      pendingRunId,
      pendingStatusId,
      onRunJob,
      onToggleStatus,
      onDelete,
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
  );
}

function InvokeTargetValue({ value }: { value: string }) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const handleRef = useCallback((element: HTMLDivElement | null) => {
    setNode(element);
  }, []);

  useLayoutEffect(() => {
    if (!node) {
      setIsOverflowing(false);
      return;
    }

    const checkOverflow = () => {
      const hasOverflow =
        node.scrollWidth > node.clientWidth ||
        node.scrollHeight > node.clientHeight;
      setIsOverflowing((prev) => (prev === hasOverflow ? prev : hasOverflow));
    };

    checkOverflow();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      checkOverflow();
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [node, value]);

  const content = (
    <div ref={handleRef} className="w-[320px] truncate font-mono text-xs">
      {value}
    </div>
  );

  if (!isOverflowing) {
    return content;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        className="max-w-xl break-words font-mono text-xs"
      >
        {value}
      </TooltipContent>
    </Tooltip>
  );
}

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
  }
}
