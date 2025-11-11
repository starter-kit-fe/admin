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
    label: string;
    badgeClass: string;
  }
> = {
  '0': {
    label: '在岗',
    badgeClass: 'bg-primary/10 text-primary border-primary/20',
  },
  '1': {
    label: '停用',
    badgeClass: 'bg-rose-100 text-rose-700 border-rose-200',
  },
};

function PostActions({
  post,
  onEdit,
  onDelete,
}: {
  post: Post;
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
}) {
  return (
    <div className="flex justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 px-2.5 text-sm font-medium"
        onClick={() => onEdit(post)}
      >
        <Pencil className="mr-1.5 size-3.5" />
        编辑
      </Button>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            aria-label="更多操作"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={(event) => {
              event.preventDefault();
              onDelete(post);
            }}
          >
            <Trash2 className="mr-2 size-4" /> 删除岗位
          </DropdownMenuItem>
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
  const columnHelper = createColumnHelper<Post>();

  const columns = [
    columnHelper.display({
      id: 'select',
      header: () => (
        <Checkbox
          aria-label="选择全部"
          checked={headerCheckboxState}
          onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
        />
      ),
      cell: ({ row }) => {
        const post = row.original;
        const isSelected = selectedIds.has(post.postId);
        return (
          <Checkbox
            aria-label={`选择 ${post.postName}`}
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
      header: '岗位名称',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{getValue()}</span>
      ),
      meta: { headerClassName: 'min-w-[160px]' },
    }),
    columnHelper.accessor('postCode', {
      header: '岗位编码',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{getValue()}</span>
      ),
      meta: { headerClassName: 'min-w-[140px]' },
    }),

    columnHelper.accessor('postSort', {
      header: '排序',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{getValue()}</span>
      ),
      meta: { headerClassName: 'w-[100px]', cellClassName: 'w-[100px]' },
    }),
    columnHelper.accessor('status', {
      header: '状态',
      cell: ({ getValue }) => {
        const meta = STATUS_META[getValue()] ?? STATUS_META['1'];
        return (
          <Badge variant="outline" className={cn(meta.badgeClass)}>
            {meta.label}
          </Badge>
        );
      },
      enableSorting: false,
      meta: { headerClassName: 'w-[120px]', cellClassName: 'w-[120px]' },
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <span className="block text-right">操作</span>,
      cell: ({ row }) => (
        <PostActions post={row.original} onEdit={onEdit} onDelete={onDelete} />
      ),
      enableSorting: false,
      meta: {
        headerClassName: 'w-[140px] text-right',
        cellClassName: 'text-right',
      },
    }),
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
                正在加载岗位...
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
          ) : rowsModel.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={visibleColumnCount}
                className="h-48 text-center align-middle"
              >
                <Empty className="border-0 bg-transparent p-4">
                  <EmptyHeader>
                    <EmptyTitle>暂无岗位数据</EmptyTitle>
                    <EmptyDescription>
                      点击“新建岗位”即可开始维护岗位信息。
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
