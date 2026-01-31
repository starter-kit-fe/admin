'use client';

import { EllipsisText } from '@/components/table/ellipsis-text';
import {
  PINNED_ACTION_COLUMN_META,
  PINNED_TABLE_CLASS,
} from '@/components/table/pinned-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Edit2, MoreHorizontal, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { CONFIG_TYPE_TABS } from '../../constants';
import type { SystemConfig } from '../../type';

const CONFIG_TYPE_META = CONFIG_TYPE_TABS.reduce<Record<string, string>>(
  (acc, tab) => {
    if (tab.value !== 'all') {
      acc[tab.value] = tab.label;
    }
    return acc;
  },
  {},
);

const columnHelper = createColumnHelper<SystemConfig>();

interface ConfigTableProps {
  rows: SystemConfig[];
  isLoading: boolean;
  onEdit: (config: SystemConfig) => void;
  onDelete: (config: SystemConfig) => void;
  selectedIds: Set<number>;
  headerCheckboxState: boolean | 'indeterminate';
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelect: (id: number, checked: boolean) => void;
}

function renderTypeBadge(type: string) {
  const label = CONFIG_TYPE_META[type];
  if (!label) {
    return null;
  }
  const isSystem = type === 'Y';
  return (
    <Badge
      variant="outline"
      className={
        isSystem
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600'
      }
    >
      {label}
    </Badge>
  );
}

export function ConfigTable({
  rows,
  isLoading,
  onEdit,
  onDelete,
  selectedIds,
  headerCheckboxState,
  onToggleSelectAll,
  onToggleSelect,
}: ConfigTableProps) {
  const { hasPermission } = usePermissions();
  const canEditConfig = hasPermission('system:config:edit');
  const canDeleteConfig = hasPermission('system:config:remove');
  const showActions = canEditConfig || canDeleteConfig;

  const columns = useMemo(() => {
    const baseColumns = [
      columnHelper.display({
        id: 'select',
        header: () => (
          <Checkbox
            aria-label="选择全部参数"
            checked={headerCheckboxState}
            onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
          />
        ),
        cell: ({ row }) => {
          const config = row.original;
          const isSelected = selectedIds.has(config.id);
          return (
            <Checkbox
              aria-label={`选择 ${config.configName}`}
              checked={isSelected}
              onCheckedChange={(checked) =>
                onToggleSelect(config.id, checked === true)
              }
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
        meta: {
          headerClassName: 'w-12',
          cellClassName: 'w-12 align-middle',
        },
      }),
      columnHelper.accessor('configName', {
        header: '参数名称',
        cell: ({ getValue }) => (
          <EllipsisText
            value={getValue()}
            className="max-w-[220px] text-sm font-medium text-foreground"
          />
        ),
        meta: { headerClassName: 'w-[220px]', cellClassName: 'w-[220px]' },
      }),
      columnHelper.accessor('configKey', {
        header: '参数键名',
        cell: ({ getValue }) => (
          <EllipsisText
            value={getValue()}
            className="max-w-[240px] font-mono text-xs text-muted-foreground"
          />
        ),
        meta: { headerClassName: 'w-[240px]', cellClassName: 'w-[240px]' },
      }),
      columnHelper.accessor('configValue', {
        header: '参数键值',
        cell: ({ getValue }) => (
          <EllipsisText
            value={getValue()}
            className="max-w-[280px] rounded bg-muted px-2 py-1 font-mono text-xs text-foreground"
            tooltipClassName="text-left"
          />
        ),
        meta: { headerClassName: 'w-[280px]', cellClassName: 'w-[280px]' },
      }),
      columnHelper.accessor('configType', {
        header: '类型',
        cell: ({ getValue }) => renderTypeBadge(getValue()),
        enableSorting: false,
        meta: { headerClassName: 'w-[90px]', cellClassName: 'w-[90px]' },
      }),
      columnHelper.accessor('remark', {
        header: '备注',
        cell: ({ row }) => (
          <EllipsisText
            value={row.original.remark}
            className="max-w-[260px] text-xs text-muted-foreground"
            tooltipClassName="text-left"
          />
        ),
        enableSorting: false,
        meta: {
          headerClassName: 'w-[260px]',
          cellClassName: 'w-[260px]',
        },
      }),
    ];

    if (showActions) {
      baseColumns.push(
        columnHelper.display({
          id: 'actions',
          header: () => <span className="block text-right">操作</span>,
          cell: ({ row }) => {
            const config = row.original;
            return (
              <ConfigRowActions
                config={config}
                canEdit={canEditConfig}
                canDelete={canDeleteConfig}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            );
          },
          enableSorting: false,
          meta: { ...PINNED_ACTION_COLUMN_META },
        }),
      );
    }

    return baseColumns;
  }, [
    canDeleteConfig,
    canEditConfig,
    headerCheckboxState,
    onDelete,
    onEdit,
    onToggleSelect,
    onToggleSelectAll,
    selectedIds,
    showActions,
  ]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const visibleColumnCount = table.getVisibleLeafColumns().length;
  const rowModel = table.getRowModel().rows;

  return (
    <Card className="overflow-hidden border py-0 shadow-none">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className={cn(PINNED_TABLE_CLASS, 'min-w-[980px]')}>
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
              {rowModel.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumnCount}
                    className="py-10 text-center align-middle"
                  >
                    <Empty className="border-0 bg-transparent p-4">
                      <EmptyHeader>
                        <EmptyTitle>
                          {isLoading ? '参数数据加载中' : '暂无参数记录'}
                        </EmptyTitle>
                        <EmptyDescription>
                          {isLoading
                            ? '正在获取系统参数，请稍候。'
                            : '先新增一条参数即可在此维护。'}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                rowModel.map((row) => (
                  <TableRow
                    key={row.id}
                    className="group transition-colors hover:bg-muted/50"
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
      </CardContent>
    </Card>
  );
}

interface ConfigRowActionsProps {
  config: SystemConfig;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (config: SystemConfig) => void;
  onDelete: (config: SystemConfig) => void;
}

function ConfigRowActions({
  config,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: ConfigRowActionsProps) {
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
            <SheetTitle>参数操作</SheetTitle>
            <SheetDescription>
              对「{config.configName}」执行需要的操作。
            </SheetDescription>
          </SheetHeader>
          <SheetFooter className="mt-0 flex-col gap-2 px-4 pb-4">
            {canEdit ? (
              <Button
                variant="secondary"
                className="w-full justify-between"
                onClick={() => {
                  onEdit(config);
                  setOpen(false);
                }}
              >
                <span className="flex items-center gap-2">
                  <Edit2 className="size-4" />
                  编辑参数
                </span>
                <span className="text-xs text-muted-foreground">
                  修改键值或说明
                </span>
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                variant="destructive"
                className="w-full justify-start gap-2"
                onClick={() => {
                  onDelete(config);
                  setOpen(false);
                }}
              >
                <Trash2 className="size-4" />
                删除参数
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
          className="text-muted-foreground "
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          aria-label={`更多操作：${config.configName}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {canEdit ? (
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              onEdit(config);
            }}
          >
            <Edit2 className="mr-2 size-4" />
            编辑参数
          </DropdownMenuItem>
        ) : null}
        {canDelete ? (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={(event) => {
              event.preventDefault();
              onDelete(config);
            }}
          >
            <Trash2 className="mr-2 size-4" />
            删除参数
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
  }
}
