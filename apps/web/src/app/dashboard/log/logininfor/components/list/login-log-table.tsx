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
import { useMemo, useState } from 'react';

import type { LoginLog } from '../../type';
import { getLoginStatusBadgeVariant, getLoginStatusLabel } from '../../utils';

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
            aria-label="更多操作"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="h-auto w-full max-w-full rounded-t-2xl border-t p-0"
        >
          <SheetHeader className="px-4 pb-2 pt-3 text-left">
            <SheetTitle>操作</SheetTitle>
            <SheetDescription>针对该条登录日志执行操作。</SheetDescription>
          </SheetHeader>
          <SheetFooter className="mt-0 flex-col gap-2 px-4 pb-4">
            <Button
              variant="destructive"
              className="w-full justify-start gap-2"
              onClick={handleDelete}
            >
              <Trash2 className="size-4" />
              删除
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
          aria-label="更多操作"
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
          删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
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

  const columns = useMemo(
    () => [
      columnHelper.accessor('userName', {
        header: () => '登录账号',
        cell: ({ row }) => {
          const log = row.original;
          return (
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {log.userName || '-'}
              </p>
              <p className="text-xs text-muted-foreground">
                地点：{log.loginLocation || '未知地点'}
              </p>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[200px]',
        },
      }),
      columnHelper.accessor('ipaddr', {
        header: () => '登录 IP',
        cell: ({ getValue }) => (
          <span className="text-sm text-foreground">{getValue() || '-'}</span>
        ),
        meta: {
          headerClassName: 'w-[160px]',
        },
      }),
      columnHelper.display({
        id: 'client',
        header: () => '客户端',
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
        header: () => '状态',
        cell: ({ getValue }) => (
          <Badge variant={getLoginStatusBadgeVariant(getValue())}>
            {getLoginStatusLabel(getValue())}
          </Badge>
        ),
        meta: {
          headerClassName: 'w-[120px]',
        },
      }),
      columnHelper.accessor('msg', {
        header: () => '提示信息',
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
      columnHelper.accessor('createdAt', {
        header: () => '登录时间',
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
              header: () => <div className="text-right">操作</div>,
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
    [canDeleteLog, columnHelper, onDelete],
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
          className={cn(PINNED_TABLE_CLASS, 'min-w-[980px] md:table-fixed')}
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
                  加载登录日志失败，请稍后再试。
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
                      <EmptyTitle>暂无登录日志数据</EmptyTitle>
                      <EmptyDescription>
                        当有新的登录行为时会自动汇总在此。
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
