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
import { cn } from '@/lib/utils';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  PINNED_ACTION_COLUMN_META,
  PINNED_TABLE_CLASS,
} from '@/components/table/pinned-actions';
import { TableLoadingSkeleton } from '@/components/table/table-loading-skeleton';
import { usePermissions } from '@/hooks/use-permissions';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

import type { Post } from '../../type';

interface PostTableProps {
  rows: Post[];
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
  selectedIds: Set<number>;
  headerCheckboxState: boolean | 'indeterminate';
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelect: (postId: number, checked: boolean) => void;
  loading?: boolean;
  isError?: boolean;
}

const STATUS_META: Record<
  Post['status'],
  {
    labelKey: 'status.0' | 'status.1';
    badgeClass: string;
  }
> = {
  '0': {
    labelKey: 'status.0',
    badgeClass: 'bg-primary/10 text-primary border-primary/20',
  },
  '1': {
    labelKey: 'status.1',
    badgeClass: 'bg-rose-100 text-rose-700 border-rose-200',
  },
};

function PostActions({
  post,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: {
  post: Post;
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const t = useTranslations('PostManagement');
  if (!canEdit && !canDelete) {
    return null;
  }
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (isMobile) {
    return (
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
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
            <SheetDescription>{t('table.actions.more')}</SheetDescription>
          </SheetHeader>
          <SheetFooter className="mt-0 flex-col gap-2 px-4 pb-4">
            {canEdit ? (
              <Button
                variant="secondary"
                className="w-full justify-between"
                onClick={() => {
                  onEdit(post);
                  setSheetOpen(false);
                }}
              >
                <span className="flex items-center gap-2">
                  <Pencil className="size-4" />
                  {t('table.actions.edit')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t('table.actions.edit')}
                </span>
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                variant="destructive"
                className="w-full justify-start gap-2"
                onClick={() => {
                  onDelete(post);
                  setSheetOpen(false);
                }}
              >
                <Trash2 className="size-4" /> {t('table.actions.delete')}
              </Button>
            ) : null}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

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
            aria-label={t('table.actions.more')}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {canEdit ? (
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                onEdit(post);
              }}
            >
              <Pencil className="mr-2 size-4" />
              {t('table.actions.edit')}
            </DropdownMenuItem>
          ) : null}
          {canDelete ? (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(event) => {
                event.preventDefault();
                onDelete(post);
              }}
            >
              <Trash2 className="mr-2 size-4" /> {t('table.actions.delete')}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function PostTable({
  rows,
  onEdit,
  onDelete,
  selectedIds,
  headerCheckboxState,
  onToggleSelectAll,
  onToggleSelect,
  loading,
  isError,
}: PostTableProps) {
  const t = useTranslations('PostManagement');
  const columnHelper = createColumnHelper<Post>();
  const { hasPermission } = usePermissions();
  const canEditPost = hasPermission('system:post:edit');
  const canDeletePost = hasPermission('system:post:remove');
  const showActions = canEditPost || canDeletePost;

  const columns = [
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
        const post = row.original;
        const isSelected = selectedIds.has(post.postId);
        return (
          <Checkbox
            aria-label={t('table.selection.selectPost', {
              target: post.postName || t('table.defaultName'),
            })}
            checked={isSelected}
            onCheckedChange={(checked) =>
              onToggleSelect(post.postId, checked === true)
            }
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
      meta: { headerClassName: 'w-12', cellClassName: 'w-12 align-middle' },
    }),
    columnHelper.accessor('postName', {
      header: t('table.columns.postName'),
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{getValue()}</span>
      ),
      meta: { headerClassName: 'min-w-[140px] md:min-w-[160px]' },
    }),
    columnHelper.accessor('postCode', {
      header: t('table.columns.postCode'),
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{getValue()}</span>
      ),
      meta: { headerClassName: 'min-w-[120px] md:min-w-[140px]' },
    }),

    columnHelper.accessor('postSort', {
      header: t('table.columns.postSort'),
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{getValue()}</span>
      ),
      meta: { headerClassName: 'w-[80px]', cellClassName: 'w-[80px]' },
    }),
    columnHelper.accessor('status', {
      header: t('table.columns.status'),
      cell: ({ getValue }) => {
        const meta = STATUS_META[getValue()] ?? STATUS_META['1'];
        return (
          <Badge variant="outline" className={cn(meta.badgeClass)}>
            {meta.labelKey ? t(meta.labelKey) : getValue()}
          </Badge>
        );
      },
      enableSorting: false,
      meta: { headerClassName: 'w-[120px]', cellClassName: 'w-[120px]' },
    }),
    ...(showActions
      ? [
          columnHelper.display({
            id: 'actions',
            header: () => (
              <span className="block text-right">
                {t('table.columns.actions')}
              </span>
            ),
            cell: ({ row }) => (
              <PostActions
                post={row.original}
                onEdit={onEdit}
                onDelete={onDelete}
                canEdit={canEditPost}
                canDelete={canDeletePost}
              />
            ),
            enableSorting: false,
            meta: { ...PINNED_ACTION_COLUMN_META },
          }),
        ]
      : []),
  ];

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const visibleColumnCount = table.getVisibleLeafColumns().length;
  const rowsModel = table.getRowModel().rows;

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border/60 bg-card dark:border-border/40 scrollbar-thin">
      <Table className={`${PINNED_TABLE_CLASS} min-w-[640px] sm:min-w-[760px] table-fixed`}>
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
                {t('table.state.error')}
              </TableCell>
            </TableRow>
          ) : rowsModel.length === 0 ? (
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
            rowsModel.map((row) => (
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
