'use client';

import type { DictData } from '@/app/dashboard/system/dict/type';
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
import { cn } from '@/lib/utils';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Edit2, MoreHorizontal, Trash2 } from 'lucide-react';
import { memo, useMemo, useState } from 'react';

import { DATA_STATUS_TABS } from '../../constants';
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

interface DictDataTableProps {
  rows: DictData[];
  isLoading: boolean;
  onEdit: (item: DictData) => void;
  onDelete: (item: DictData) => void;
  className?: string;
}

const columnHelper = createColumnHelper<DictData>();

function renderStatusBadge(status?: string | null) {
  const meta = DATA_STATUS_TABS.find((tab) => tab.value === status);
  if (!meta || meta.value === 'all') {
    return null;
  }
  const tone =
    status === '0'
      ? 'bg-primary/10 text-primary'
      : 'bg-destructive/10 text-destructive';

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-transparent px-2 py-0 text-[11px] font-medium',
        tone,
      )}
    >
      {meta.label}
    </Badge>
  );
}

function DictDataTableComponent({
  rows,
  isLoading,
  onEdit,
  onDelete,
  className,
}: DictDataTableProps) {
  const { hasPermission } = usePermissions();
  const canEditDict = hasPermission('system:dict:edit');
  const canDeleteDict = hasPermission('system:dict:remove');
  const showActions = canEditDict || canDeleteDict;
  const isMobile = useIsMobile();

  const columns = useMemo(() => {
    const baseColumns = [
      columnHelper.accessor('dictLabel', {
        header: '标签',
        cell: ({ row }) => {
          const dict = row.original;
          return (
            <div className="flex items-center gap-2">
              <span>{dict.dictLabel}</span>
              {renderStatusBadge(dict.status)}
            </div>
          );
        },
        meta: { headerClassName: 'w-[160px]' },
      }),
      columnHelper.accessor('dictValue', {
        header: '键值',
        cell: ({ getValue }) => <span>{getValue()}</span>,
        meta: { headerClassName: 'w-[140px]' },
      }),
      columnHelper.display({
        id: 'dictSort',
        header: '排序',
        cell: ({ row }) => <span>{row.original.dictSort ?? 0}</span>,
        meta: { headerClassName: 'w-[100px]' },
      }),
      columnHelper.display({
        id: 'isDefault',
        header: '是否默认',
        cell: ({ row }) =>
          row.original.isDefault === 'Y' ? (
            <Badge
              variant="outline"
              className="border-transparent bg-primary/10 px-2 py-0 text-xs text-primary"
            >
              默认
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">否</span>
          ),
        meta: { headerClassName: 'w-[120px]' },
      }),
      columnHelper.display({
        id: 'remark',
        header: '备注',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.remark ?? '—'}
          </span>
        ),
        meta: { headerClassName: 'min-w-[180px]' },
      }),
    ];

    if (showActions) {
      baseColumns.push(
        columnHelper.display({
          id: 'actions',
          header: () => <span className="block text-right">操作</span>,
          cell: ({ row }) => {
            const dict = row.original;
            if (isMobile) {
              return (
                <DictDataMobileActions
                  dict={dict}
                  canEdit={canEditDict}
                  canDelete={canDeleteDict}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              );
            }
            return (
              <div className="flex justify-end">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground"
                      aria-label={`更多操作：${dict.dictLabel}`}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    {canEditDict ? (
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          onEdit(dict);
                        }}
                      >
                        <Edit2 className="mr-2 size-3.5" />
                        编辑
                      </DropdownMenuItem>
                    ) : null}
                    {canDeleteDict ? (
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={(event) => {
                          event.preventDefault();
                          onDelete(dict);
                        }}
                      >
                        <Trash2 className="mr-2 size-3.5" />
                        删除
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          },
          meta: { headerClassName: 'w-[120px]', cellClassName: 'text-right' },
        }),
      );
    }

    return baseColumns;
  }, [canDeleteDict, canEditDict, isMobile, onDelete, onEdit, showActions]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const tableRows = table.getRowModel().rows;
  const visibleColumnCount = table.getVisibleLeafColumns().length;

  const baseTableClasses = 'w-full caption-bottom text-sm';
  const baseHeadClasses =
    'text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]';
  const baseCellClasses =
    'p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]';
  const baseRowClasses =
    'border-b transition-colors  data-[state=selected]:bg-muted';

  return (
    <div
      className={cn(
        'h-full overflow-hidden rounded-xl border border-border/50',
        className,
      )}
    >
      <div className="h-full overflow-auto">
        <div className="min-w-[720px]">
          <table className={baseTableClasses}>
            <thead className="sticky top-0 z-10 bg-card shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-muted/40">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        baseHeadClasses,
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
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumnCount}
                    className={cn(baseCellClasses, 'py-10 text-center')}
                  >
                    <Empty className="border-0 bg-transparent p-4">
                      <EmptyHeader>
                        <EmptyTitle>
                          {isLoading ? '字典数据加载中' : '暂无字典项'}
                        </EmptyTitle>
                        <EmptyDescription>
                          {isLoading
                            ? '正在获取字典项，请稍候。'
                            : '请先新增一条字典项以开始管理。'}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </td>
                </tr>
              ) : (
                tableRows.map((row) => (
                  <tr key={row.id} className={baseRowClasses}>
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          baseCellClasses,
                          cell.column.columnDef.meta?.cellClassName as
                            | string
                            | undefined,
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export const DictDataTable = memo(DictDataTableComponent);
DictDataTable.displayName = 'DictDataTable';

function DictDataMobileActions({
  dict,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  dict: DictData;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (item: DictData) => void;
  onDelete: (item: DictData) => void;
}) {
  const [open, setOpen] = useState(false);

  if (!canEdit && !canDelete) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          aria-label="更多操作"
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
          <SheetTitle>操作</SheetTitle>
          <SheetDescription>为该字典项选择要执行的操作。</SheetDescription>
        </SheetHeader>
        <SheetFooter className="mt-0 flex-col gap-2 px-4 pb-4">
          {canEdit ? (
            <Button
              variant="secondary"
              className="w-full justify-between"
              onClick={() => {
                onEdit(dict);
                setOpen(false);
              }}
            >
              <span className="flex items-center gap-2">
                <Edit2 className="size-4" />
                编辑
              </span>
              <span className="text-xs text-muted-foreground">修改标签与键值</span>
            </Button>
          ) : null}
          {canDelete ? (
            <Button
              variant="destructive"
              className="w-full justify-start gap-2"
              onClick={() => {
                onDelete(dict);
                setOpen(false);
              }}
            >
              <Trash2 className="size-4" />
              删除
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
  }
}
