'use client';

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Edit2, MoreHorizontal, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { usePermissions } from '@/hooks/use-permissions';

import type { ConfigType, SystemConfig } from '../../type';

const columnHelper = createColumnHelper<SystemConfig>();

interface ConfigTableProps {
  rows: SystemConfig[];
  isLoading: boolean;
  onEdit: (config: SystemConfig) => void;
  onDelete: (config: SystemConfig) => void;
  selectedIds: Set<number>;
  headerCheckboxState: boolean | 'indeterminate';
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelect: (configId: number, checked: boolean) => void;
}

function renderTypeBadge(type: string, label?: string) {
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
  const tTable = useTranslations('ConfigManagement.table');
  const { hasPermission } = usePermissions();
  const canEditConfig = hasPermission('system:config:edit');
  const canDeleteConfig = hasPermission('system:config:remove');
  const showActions = canEditConfig || canDeleteConfig;

  const typeLabels = useMemo<Record<ConfigType, string>>(
    () => ({
      Y: tTable('type.Y'),
      N: tTable('type.N'),
    }),
    [tTable],
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
          const config = row.original;
          const isSelected = selectedIds.has(config.configId);
          return (
            <Checkbox
              aria-label={tTable('selection.selectItem', {
                target: config.configName,
              })}
              checked={isSelected}
              onCheckedChange={(checked) =>
                onToggleSelect(config.configId, checked === true)
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
        header: tTable('columns.configName'),
        cell: ({ getValue }) => (
          <span className="text-sm text-foreground">{getValue()}</span>
        ),
        meta: { headerClassName: 'min-w-[200px]' },
      }),
      columnHelper.accessor('configKey', {
        header: tTable('columns.configKey'),
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue()}</span>
        ),
        meta: { headerClassName: 'min-w-[160px]' },
      }),
      columnHelper.accessor('configValue', {
        header: tTable('columns.configValue'),
        cell: ({ getValue }) => (
          <code className="inline-flex rounded bg-muted px-2 py-1 text-xs">
            {getValue()}
          </code>
        ),
        meta: { headerClassName: 'min-w-[220px]' },
      }),
      columnHelper.accessor('configType', {
        header: tTable('columns.configType'),
        cell: ({ getValue }) => {
          const value = getValue() as ConfigType;
          return renderTypeBadge(value, typeLabels[value]);
        },
        enableSorting: false,
        meta: { headerClassName: 'w-[120px]', cellClassName: 'w-[120px]' },
      }),
      columnHelper.accessor('remark', {
        header: tTable('columns.remark'),
        cell: ({ row }) => {
          const remark = row.original.remark?.trim();
          if (!remark) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block max-w-[220px] truncate text-xs text-muted-foreground">
                  {remark}
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="end"
                className="max-w-xs break-words text-left"
              >
                {remark}
              </TooltipContent>
            </Tooltip>
          );
        },
        enableSorting: false,
        meta: {
          headerClassName: 'w-[220px]',
          cellClassName: 'w-[220px]',
        },
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
          cell: ({ row }) => {
            const config = row.original;
            return (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => event.stopPropagation()}
                    aria-label={tTable('actions.moreAria', {
                      target: config.configName,
                    })}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  {canEditConfig ? (
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        onEdit(config);
                      }}
                    >
                      <Edit2 className="mr-2 size-4" />
                      {tTable('actions.edit')}
                    </DropdownMenuItem>
                  ) : null}
                  {canDeleteConfig ? (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={(event) => {
                        event.preventDefault();
                        onDelete(config);
                      }}
                    >
                      <Trash2 className="mr-2 size-4" />
                      {tTable('actions.delete')}
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          },
          enableSorting: false,
          meta: {
            headerClassName:
              'sticky right-0 z-20 w-[140px] bg-card text-right',
            cellClassName:
              'sticky right-0 z-10 w-[140px] bg-card text-right group-hover:bg-muted/50',
          },
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
    tTable,
    typeLabels,
  ]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const visibleColumnCount = table.getVisibleLeafColumns().length;
  const rowModel = table.getRowModel().rows;

  return (
    <Card className="border py-0 shadow-none overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
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
                          {isLoading
                            ? tTable('empty.title.loading')
                            : tTable('empty.title.idle')}
                        </EmptyTitle>
                        <EmptyDescription>
                          {isLoading
                            ? tTable('empty.description.loading')
                            : tTable('empty.description.idle')}
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

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
  }
}
