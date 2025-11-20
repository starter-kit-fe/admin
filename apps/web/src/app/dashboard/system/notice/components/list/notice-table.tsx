'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format, isValid, parse, parseISO } from 'date-fns';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useMemo } from 'react';

import {
  PINNED_ACTION_COLUMN_META,
  PINNED_TABLE_CLASS,
} from '@/components/table/pinned-actions';
import { TableLoadingSkeleton } from '@/components/table/table-loading-skeleton';
import type { Notice } from '../../type';

interface NoticeTableProps {
  records: Notice[];
  loading?: boolean;
  isError?: boolean;
  headerCheckboxState: boolean | 'indeterminate';
  onToggleSelectAll: (checked: boolean) => void;
  selectedIds: Set<number>;
  onToggleSelect: (noticeId: number, checked: boolean) => void;
  onEdit: (notice: Notice) => void;
  onDelete: (notice: Notice) => void;
}

const STATUS_META: Record<
  Notice['status'],
  { label: string; className: string }
> = {
  '0': {
    label: '正常',
    className: 'bg-primary/10 text-primary border-transparent',
  },
  '1': {
    label: '停用',
    className: 'bg-destructive/10 text-destructive border-transparent',
  },
};

const TYPE_META: Record<
  Notice['noticeType'],
  { label: string; className: string }
> = {
  '1': {
    label: '通知',
    className: 'bg-secondary/70 text-secondary-foreground border-transparent',
  },
  '2': {
    label: '公告',
    className: 'bg-muted text-muted-foreground border-transparent',
  },
};

const MINI_BADGE_CLASS =
  'h-5 rounded-full px-2 text-[11px] font-medium tracking-tight';

const DATE_OUTPUT_FORMAT = 'yyyy-MM-dd HH:mm';

const parseNoticeDate = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = trimmed.includes('T')
    ? trimmed
    : trimmed.replace(' ', 'T');
  const parsedIso = parseISO(normalized);
  if (isValid(parsedIso)) {
    return parsedIso;
  }
  const parsed = parse(trimmed, 'yyyy-MM-dd HH:mm:ss', new Date());
  if (isValid(parsed)) {
    return parsed;
  }
  return null;
};

const formatNoticeDate = (value?: string | null) => {
  if (!value) {
    return '—';
  }
  const parsed = parseNoticeDate(value);
  if (!parsed) {
    return value;
  }
  return format(parsed, DATE_OUTPUT_FORMAT);
};

function NoticeActions({
  notice,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: {
  notice: Notice;
  onEdit: (notice: Notice) => void;
  onDelete: (notice: Notice) => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  if (!canEdit && !canDelete) {
    return null;
  }
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 hover:text-primary"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          aria-label="更多操作"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {canEdit ? (
          <DropdownMenuItem onSelect={() => onEdit(notice)}>
            <Pencil className="mr-2 size-4" />
            编辑
          </DropdownMenuItem>
        ) : null}
        {canDelete ? (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={(event) => {
              event.preventDefault();
              onDelete(notice);
            }}
          >
            <Trash2 className="mr-2 size-4" />
            删除
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function NoticeTable({
  records,
  loading = false,
  isError = false,
  headerCheckboxState,
  onToggleSelectAll,
  selectedIds,
  onToggleSelect,
  onEdit,
  onDelete,
}: NoticeTableProps) {
  const columnHelper = useMemo(() => createColumnHelper<Notice>(), []);
  const { hasPermission } = usePermissions();
  const canEditNotice = hasPermission('system:notice:edit');
  const canDeleteNotice = hasPermission('system:notice:remove');
  const showActions = canEditNotice || canDeleteNotice;

  const columns = useMemo(() => {
    const baseColumns = [
      columnHelper.display({
        id: 'select',
        header: () => (
          <Checkbox
            aria-label="选择全部公告"
            checked={headerCheckboxState}
            onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
          />
        ),
        cell: ({ row }) => {
          const notice = row.original;
          const isSelected = selectedIds.has(notice.noticeId);
          return (
            <Checkbox
              aria-label={`选择 ${notice.noticeTitle}`}
              checked={isSelected}
              onCheckedChange={(checked) =>
                onToggleSelect(notice.noticeId, checked === true)
              }
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
        meta: { headerClassName: 'w-12', cellClassName: 'w-12 align-middle' },
      }),
      columnHelper.display({
        id: 'title',
        header: () => '标题',
        cell: ({ row }) => {
          const notice = row.original;
          const typeMeta = TYPE_META[notice.noticeType] ?? TYPE_META['1'];
          const statusMeta = STATUS_META[notice.status] ?? STATUS_META['1'];
          return (
            <div className="flex flex-col gap-2">
              <span className="font-medium text-foreground">
                {notice.noticeTitle}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className={cn(MINI_BADGE_CLASS, typeMeta.className)}
                >
                  {typeMeta.label}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn(MINI_BADGE_CLASS, statusMeta.className)}
                >
                  {statusMeta.label}
                </Badge>
              </div>
            </div>
          );
        },
        meta: { headerClassName: 'min-w-[220px]' },
      }),
      columnHelper.display({
        id: 'content',
        header: () => '内容',
        cell: ({ row }) => (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {row.original.noticeContent}
          </p>
        ),
        meta: { headerClassName: 'min-w-[240px]' },
      }),
      columnHelper.accessor('remark', {
        header: () => '备注',
        cell: ({ getValue }) => {
          const value = getValue();
          return (
            <span className="text-sm text-muted-foreground">
              {value?.trim() ? value : '—'}
            </span>
          );
        },
        meta: { headerClassName: 'w-[160px]', cellClassName: 'w-[160px]' },
      }),
      columnHelper.display({
        id: 'updatedAt',
        header: () => '更新时间',
        cell: ({ row }) => {
          const timeLabel = row.original.updateTime ?? row.original.createTime;
          return (
            <span className="text-sm text-muted-foreground">
              {formatNoticeDate(timeLabel)}
            </span>
          );
        },
        meta: { headerClassName: 'w-[160px]', cellClassName: 'w-[160px]' },
      }),
    ];

    if (showActions) {
      baseColumns.push(
        columnHelper.display({
          id: 'actions',
          header: () => <span className="block text-right">操作</span>,
          cell: ({ row }) => (
            <div className="flex justify-end">
              <NoticeActions
                notice={row.original}
                onEdit={onEdit}
                onDelete={onDelete}
                canEdit={canEditNotice}
                canDelete={canDeleteNotice}
              />
            </div>
          ),
          meta: {
            ...PINNED_ACTION_COLUMN_META,
          },
        }),
      );
    }

    return baseColumns;
  }, [
    canDeleteNotice,
    canEditNotice,
    columnHelper,
    headerCheckboxState,
    onDelete,
    onEdit,
    onToggleSelect,
    onToggleSelectAll,
    selectedIds,
    showActions,
  ]);

  const table = useReactTable({
    data: records,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const visibleColumnCount = table.getVisibleLeafColumns().length;
  const rows = table.getRowModel().rows;

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card dark:border-border/40">
      <Table className={PINNED_TABLE_CLASS}>
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
          {loading ? (
            <TableLoadingSkeleton columns={visibleColumnCount} />
          ) : isError ? (
            <TableRow>
              <TableCell
                colSpan={visibleColumnCount}
                className="h-24 text-center text-sm text-destructive"
              >
                加载失败，请稍后重试。
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={visibleColumnCount} className="h-48">
                <Empty className="border-0 bg-transparent p-6">
                  <EmptyHeader>
                    <EmptyTitle>暂无公告记录</EmptyTitle>
                    <EmptyDescription>
                      发布公告后即可在此查看与管理。
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
  }
}
