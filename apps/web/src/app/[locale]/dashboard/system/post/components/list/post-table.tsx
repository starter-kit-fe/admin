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

import { usePermissions } from '@/hooks/use-permissions';
import { useTranslations } from 'next-intl';

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

const STATUS_BADGE_CLASS: Record<Post['status'], string> = {
  '0': 'bg-primary/10 text-primary border-primary/20',
  '1': 'bg-rose-100 text-rose-700 border-rose-200',
};

function PostActions({
  post,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  labels,
}: {
  post: Post;
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
  canEdit: boolean;
  canDelete: boolean;
  labels: {
    moreAria: string;
    edit: string;
    delete: string;
  };
}) {
  if (!canEdit && !canDelete) {
    return null;
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
            aria-label={labels.moreAria}
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
              {labels.edit}
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
              <Trash2 className="mr-2 size-4" /> {labels.delete}
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
  const tTable = useTranslations('PostManagement.table');
  const tColumns = useTranslations('PostManagement.table.columns');
  const tActions = useTranslations('PostManagement.table.actions');
  const tSelection = useTranslations('PostManagement.table.selection');
  const tState = useTranslations('PostManagement.table.state');
  const tStatus = useTranslations('PostManagement.status');
  const columnHelper = createColumnHelper<Post>();
  const { hasPermission } = usePermissions();
  const canEditPost = hasPermission('system:post:edit');
  const canDeletePost = hasPermission('system:post:remove');
  const showActions = canEditPost || canDeletePost;
  const fallbackName = tTable('defaultName');

  const columns = [
    columnHelper.display({
      id: 'select',
      header: () => (
        <Checkbox
          aria-label={tSelection('selectAll')}
          checked={headerCheckboxState}
          onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
        />
      ),
      cell: ({ row }) => {
        const post = row.original;
        const isSelected = selectedIds.has(post.postId);
        const labelTarget = post.postName || fallbackName;
        return (
          <Checkbox
            aria-label={tSelection('selectPost', { target: labelTarget })}
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
      header: tColumns('postName'),
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{getValue()}</span>
      ),
      meta: { headerClassName: 'min-w-[160px]' },
    }),
    columnHelper.accessor('postCode', {
      header: tColumns('postCode'),
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{getValue()}</span>
      ),
      meta: { headerClassName: 'min-w-[140px]' },
    }),

    columnHelper.accessor('postSort', {
      header: tColumns('postSort'),
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{getValue()}</span>
      ),
      meta: { headerClassName: 'w-[100px]', cellClassName: 'w-[100px]' },
    }),
    columnHelper.accessor('status', {
      header: tColumns('status'),
      cell: ({ getValue }) => {
        const status = (getValue() ?? '1') as Post['status'];
        const badgeClass =
          STATUS_BADGE_CLASS[status] ?? STATUS_BADGE_CLASS['1'];
        const label = tStatus(status);
        return (
          <Badge variant="outline" className={cn(badgeClass)}>
            {label}
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
              <span className="block text-right">{tColumns('actions')}</span>
            ),
            cell: ({ row }) => (
              <PostActions
                post={row.original}
                onEdit={onEdit}
                onDelete={onDelete}
                canEdit={canEditPost}
                canDelete={canDeletePost}
                labels={{
                  moreAria: tActions('more'),
                  edit: tActions('edit'),
                  delete: tActions('delete'),
                }}
              />
            ),
            enableSorting: false,
            meta: {
              headerClassName: 'w-[140px] text-right',
              cellClassName: 'text-right',
            },
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
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card  dark:border-border/40">
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
                {tState('loading')}
              </TableCell>
            </TableRow>
          ) : isError ? (
            <TableRow>
              <TableCell
                colSpan={visibleColumnCount}
                className="h-24 text-center text-sm text-destructive"
              >
                {tState('error')}
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
                    <EmptyTitle>{tState('emptyTitle')}</EmptyTitle>
                    <EmptyDescription>
                      {tState('emptyDescription')}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          ) : (
            rowsModel.map((row) => (
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
