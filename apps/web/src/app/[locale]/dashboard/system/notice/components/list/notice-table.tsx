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
import { useTranslations } from 'next-intl';

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

const STATUS_BADGE_META: Record<
  Notice['status'],
  { className: string }
> = {
  '0': {
    className: 'bg-primary/10 text-primary border-transparent',
  },
  '1': {
    className: 'bg-destructive/10 text-destructive border-transparent',
  },
};

const TYPE_BADGE_META: Record<
  Notice['noticeType'],
  { className: string }
> = {
  '1': {
    className: 'bg-secondary/70 text-secondary-foreground border-transparent',
  },
  '2': {
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
  labels,
}: {
  notice: Notice;
  onEdit: (notice: Notice) => void;
  onDelete: (notice: Notice) => void;
  canEdit: boolean;
  canDelete: boolean;
  labels: {
    edit: string;
    delete: string;
    moreAria: (target: string) => string;
  };
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
          aria-label={labels.moreAria(notice.noticeTitle)}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {canEdit ? (
          <DropdownMenuItem onSelect={() => onEdit(notice)}>
            <Pencil className="mr-2 size-4" />
            {labels.edit}
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
            {labels.delete}
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
  const tTable = useTranslations('NoticeManagement.table');
  const tStatus = useTranslations('NoticeManagement.status');
  const tTypes = useTranslations('NoticeManagement.types');
  const columnHelper = useMemo(() => createColumnHelper<Notice>(), []);
  const { hasPermission } = usePermissions();
  const canEditNotice = hasPermission('system:notice:edit');
  const canDeleteNotice = hasPermission('system:notice:remove');
  const showActions = canEditNotice || canDeleteNotice;

  const statusMeta = useMemo(
    () => ({
      '0': {
        label: tStatus('0'),
        className: STATUS_BADGE_META['0'].className,
      },
      '1': {
        label: tStatus('1'),
        className: STATUS_BADGE_META['1'].className,
      },
    }),
    [tStatus],
  );

  const typeMeta = useMemo(
    () => ({
      '1': {
        label: tTypes('1'),
        className: TYPE_BADGE_META['1'].className,
      },
      '2': {
        label: tTypes('2'),
        className: TYPE_BADGE_META['2'].className,
      },
    }),
    [tTypes],
  );

  const columns = useMemo(() => {
    const baseColumns = [
      columnHelper.display({
        id: 'select',
        header: () => (
          <Checkbox
            aria-label={tTable('selection.selectAll')}
            checked={headerCheckboxState}
            onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
          />
        ),
        cell: ({ row }) => {
          const notice = row.original;
          const isSelected = selectedIds.has(notice.noticeId);
          return (
            <Checkbox
              aria-label={tTable('selection.selectItem', {
                target: notice.noticeTitle,
              })}
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
        header: () => tTable('columns.title'),
        cell: ({ row }) => {
          const notice = row.original;
          const typeInfo = typeMeta[notice.noticeType] ?? typeMeta['1'];
          const statusInfo = statusMeta[notice.status] ?? statusMeta['1'];
          return (
            <div className="flex flex-col gap-2">
              <span className="font-medium text-foreground">
                {notice.noticeTitle}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className={cn(MINI_BADGE_CLASS, typeInfo.className)}
                >
                  {typeInfo.label}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn(MINI_BADGE_CLASS, statusInfo.className)}
                >
                  {statusInfo.label}
                </Badge>
              </div>
            </div>
          );
        },
        meta: { headerClassName: 'min-w-[220px]' },
      }),
      columnHelper.display({
        id: 'content',
        header: () => tTable('columns.content'),
        cell: ({ row }) => (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {row.original.noticeContent}
          </p>
        ),
        meta: { headerClassName: 'min-w-[240px]' },
      }),
      columnHelper.accessor('remark', {
        header: () => tTable('columns.remark'),
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
        header: () => tTable('columns.updatedAt'),
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
          header: () => (
            <span className="block text-right">
              {tTable('columns.actions')}
            </span>
          ),
          cell: ({ row }) => (
            <div className="flex justify-end">
              <NoticeActions
                notice={row.original}
                onEdit={onEdit}
                onDelete={onDelete}
                canEdit={canEditNotice}
                canDelete={canDeleteNotice}
                labels={{
                  edit: tTable('actions.edit'),
                  delete: tTable('actions.delete'),
                  moreAria: (target: string) =>
                    tTable('actions.moreAria', { target }),
                }}
              />
            </div>
          ),
          meta: {
            headerClassName: 'w-[120px] text-right',
            cellClassName: 'text-right',
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
    statusMeta,
    tTable,
    typeMeta,
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
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={visibleColumnCount}
                className="h-24 text-center text-sm text-muted-foreground"
              >
                {tTable('feedback.loading')}
              </TableCell>
            </TableRow>
          ) : isError ? (
            <TableRow>
              <TableCell
                colSpan={visibleColumnCount}
                className="h-24 text-center text-sm text-destructive"
              >
                {tTable('feedback.error')}
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={visibleColumnCount} className="h-48">
                <Empty className="border-0 bg-transparent p-6">
                  <EmptyHeader>
                    <EmptyTitle>{tTable('feedback.emptyTitle')}</EmptyTitle>
                    <EmptyDescription>
                      {tTable('feedback.emptyDescription')}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
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
