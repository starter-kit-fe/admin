'use client';

import { EllipsisText } from '@/components/table/ellipsis-text';
import {
  PINNED_ACTION_COLUMN_META,
  PINNED_TABLE_CLASS,
} from '@/components/table/pinned-actions';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { usePermissions } from '@/hooks/use-permissions';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format, isValid, parse, parseISO } from 'date-fns';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

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

const STATUS_META: Record<Notice['status'], { className: string }> = {
  '0': { className: 'bg-primary/10 text-primary border-transparent' },
  '1': { className: 'bg-destructive/10 text-destructive border-transparent' },
};

const TYPE_META: Record<Notice['noticeType'], { className: string }> = {
  '1': { className: 'bg-secondary/70 text-secondary-foreground border-transparent' },
  '2': { className: 'bg-muted text-muted-foreground border-transparent' },
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
  const t = useTranslations('NoticeManagement');
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (!canEdit && !canDelete) {
    return null;
  }

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label={t('table.actions.moreAria', {
              target: notice.noticeTitle || t('table.columns.title'),
            })}
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
            <SheetTitle>{t('table.columns.actions')}</SheetTitle>
            <SheetDescription>
              {t('table.actions.moreAria', {
                target: notice.noticeTitle || t('table.columns.title'),
              })}
            </SheetDescription>
          </SheetHeader>
          <SheetFooter className="mt-0 flex-col gap-2 px-4 pb-4">
            {canEdit ? (
              <Button
                variant="secondary"
                className="w-full justify-between"
                onClick={() => {
                  onEdit(notice);
                  setOpen(false);
                }}
              >
                <span className="flex items-center gap-2">
                  <Pencil className="size-4" />
                  {t('table.actions.edit')}
                </span>
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                variant="destructive"
                className="w-full justify-start gap-2"
                onClick={() => {
                  onDelete(notice);
                  setOpen(false);
                }}
              >
                <Trash2 className="size-4" />
                {t('table.actions.delete')}
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
          aria-label={t('table.actions.moreAria', {
            target: notice.noticeTitle || t('table.columns.title'),
          })}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {canEdit ? (
          <DropdownMenuItem onSelect={() => onEdit(notice)}>
            <Pencil className="mr-2 size-3.5" />
            {t('table.actions.edit')}
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
            <Trash2 className="mr-2 size-3.5" />
            {t('table.actions.delete')}
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
  const t = useTranslations('NoticeManagement');
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
            aria-label={t('table.selection.selectAll')}
            checked={headerCheckboxState}
            onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
          />
        ),
        cell: ({ row }) => {
          const notice = row.original;
          const isSelected = selectedIds.has(notice.noticeId);
          return (
            <Checkbox
              aria-label={t('table.selection.selectItem', {
                target: notice.noticeTitle || t('table.columns.title'),
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
        header: () => t('table.columns.title'),
        cell: ({ row }) => {
          const notice = row.original;
          const typeKey = (notice.noticeType ?? '1') as Notice['noticeType'];
          const statusKey = (notice.status ?? '1') as Notice['status'];
          const typeMeta = TYPE_META[typeKey] ?? TYPE_META['1'];
          const statusMeta = STATUS_META[statusKey] ?? STATUS_META['1'];
          return (
            <div className="flex flex-col gap-2">
              <EllipsisText
                value={notice.noticeTitle}
                className="w-full max-w-[260px] font-medium text-foreground"
                tooltipClassName="max-w-lg text-sm leading-relaxed text-foreground"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className={cn(MINI_BADGE_CLASS, typeMeta.className)}
                >
                  {t(`types.${typeKey}` as const)}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn(MINI_BADGE_CLASS, statusMeta.className)}
                >
                  {t(`status.${statusKey}` as const)}
                </Badge>
              </div>
            </div>
          );
        },
        meta: { headerClassName: 'w-[260px]', cellClassName: 'w-[260px]' },
      }),
      columnHelper.display({
        id: 'content',
        header: () => t('table.columns.content'),
        cell: ({ row }) => (
          <EllipsisText
            value={row.original.noticeContent}
            className="w-full max-w-[360px] text-sm text-muted-foreground"
            tooltipClassName="max-w-xl whitespace-pre-wrap text-left text-sm leading-relaxed"
          />
        ),
        meta: { headerClassName: 'w-[360px]', cellClassName: 'w-[360px]' },
      }),
      columnHelper.accessor('remark', {
        header: () => t('table.columns.remark'),
        cell: ({ getValue }) => (
          <EllipsisText
            value={getValue()}
            className="max-w-[200px] text-xs text-muted-foreground"
            tooltipClassName="text-left"
          />
        ),
        meta: { headerClassName: 'w-[200px]', cellClassName: 'w-[200px]' },
      }),
      columnHelper.display({
        id: 'updatedAt',
        header: () => t('table.columns.updatedAt'),
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
            <span className="block text-right">{t('table.columns.actions')}</span>
          ),
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
    t,
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
      <Table className={cn(PINNED_TABLE_CLASS, 'min-w-[960px]')}>
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
                {t('table.feedback.error')}
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={visibleColumnCount} className="h-48">
                <Empty className="border-0 bg-transparent p-6">
                  <EmptyHeader>
                    <EmptyTitle>{t('table.feedback.emptyTitle')}</EmptyTitle>
                    <EmptyDescription>
                      {t('table.feedback.emptyDescription')}
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
