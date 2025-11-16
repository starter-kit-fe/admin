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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { usePermissions } from '@/hooks/use-permissions';

import type { Role } from '../../type';

interface RoleTableProps {
  rows: Role[];
  headerCheckboxState: boolean | 'indeterminate';
  onToggleSelectAll: (checked: boolean) => void;
  selectedIds: Set<number>;
  onToggleSelect: (roleId: number, checked: boolean) => void;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  isLoading?: boolean;
  isError?: boolean;
}

const STATUS_META: Record<
  Role['status'],
  {
    labelKey: 'enabled' | 'disabled';
    badgeClass: string;
  }
> = {
  '0': {
    labelKey: 'enabled',
    badgeClass: 'bg-primary/10 text-primary',
  },
  '1': {
    labelKey: 'disabled',
    badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
  },
};

function getDateTimeLabel(value?: string | null) {
  if (!value) return '-';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  } catch {
    return value;
  }
}

function RoleRowActions({
  role,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: {
  role: Role;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const tTable = useTranslations('RoleManagement.table');
  const tActions = useTranslations('RoleManagement.table.actions');
  if (!canEdit && !canDelete) {
    return null;
  }
  return (
    <div className="flex justify-end">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()} 
            aria-label={tActions('more')}
            disabled={!canEdit && !canDelete}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {canEdit ? (
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                onEdit(role);
              }}
            >
              <Pencil className="mr-2 size-4" />
              {tActions('edit')}
            </DropdownMenuItem>
          ) : null}
          {canDelete ? (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(event) => {
                event.preventDefault();
                onDelete(role);
              }}
            >
              <Trash2 className="mr-2 size-4" /> {tActions('delete')}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function RoleTable({
  rows,
  headerCheckboxState,
  onToggleSelectAll,
  selectedIds,
  onToggleSelect,
  onEdit,
  onDelete,
  isLoading,
  isError,
}: RoleTableProps) {
  const columnHelper = useMemo(() => createColumnHelper<Role>(), []);
  const tTable = useTranslations('RoleManagement.table');
  const tStatus = useTranslations('RoleManagement.status');
  const { hasPermission } = usePermissions();
  const canEditRole = hasPermission('system:role:edit');
  const canDeleteRole = hasPermission('system:role:remove');
  const showRowActions = canEditRole || canDeleteRole;

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
          const role = row.original;
          const isSelected = selectedIds.has(role.roleId);
          const targetLabel = role.roleName?.trim() || `#${role.roleId}`;
          return (
            <Checkbox
              aria-label={tTable('selection.selectRole', {
                target: targetLabel,
              })}
              checked={isSelected}
              onCheckedChange={(checked) =>
                onToggleSelect(role.roleId, checked === true)
              }
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
        meta: { headerClassName: 'w-12', cellClassName: 'w-12 align-middle' },
      }),
      columnHelper.accessor('roleName', {
        header: tTable('columns.name'),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {row.original.roleName}
            </span>
            <span className="text-xs text-muted-foreground">
              #{row.original.roleId}
            </span>
          </div>
        ),
        meta: { headerClassName: 'min-w-[200px]' },
      }),
      columnHelper.accessor('roleKey', {
        header: tTable('columns.key'),
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue()}</span>
        ),
        meta: { headerClassName: 'min-w-[180px]' },
      }),
      columnHelper.accessor('status', {
        header: tTable('columns.status'),
        cell: ({ getValue }) => {
          const meta = STATUS_META[getValue()] ?? STATUS_META['1'];
          return (
            <Badge
              variant="outline"
              className={cn(
                'border-transparent px-2.5 py-1 text-xs font-medium capitalize',
                meta.badgeClass,
              )}
            >
              {tStatus(meta.labelKey)}
            </Badge>
          );
        },
        enableSorting: false,
        meta: { headerClassName: 'w-[120px]' },
      }),
      columnHelper.accessor('createTime', {
        header: tTable('columns.createdAt'),
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {getDateTimeLabel(getValue())}
          </span>
        ),
        meta: { headerClassName: 'min-w-[180px]' },
      }),
    ];

    if (showRowActions) {
      baseColumns.push(
        columnHelper.display({
          id: 'actions',
          header: () => (
            <span className="block text-right">{tTable('columns.actions')}</span>
          ),
          cell: ({ row }) => (
            <RoleRowActions
              role={row.original}
              onEdit={onEdit}
              onDelete={onDelete}
              canEdit={canEditRole}
              canDelete={canDeleteRole}
            />
          ),
          enableSorting: false,
          meta: {
            headerClassName: 'w-[140px] text-right',
            cellClassName: 'text-right',
          },
        }),
      );
    }

    return baseColumns;
  }, [
    canDeleteRole,
    canEditRole,
    columnHelper,
    headerCheckboxState,
    onDelete,
    onEdit,
    onToggleSelect,
    onToggleSelectAll,
    selectedIds,
    showRowActions,
    tStatus,
    tTable,
  ]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const visibleColumnCount = table.getVisibleLeafColumns().length;

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
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={visibleColumnCount}
                className="h-24 text-center text-sm text-muted-foreground"
              >
                {tTable('state.loading')}
              </TableCell>
            </TableRow>
          ) : isError ? (
            <TableRow>
              <TableCell
                colSpan={visibleColumnCount}
                className="h-24 text-center text-sm text-destructive"
              >
                {tTable('state.error')}
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
                    <EmptyTitle>{tTable('state.emptyTitle')}</EmptyTitle>
                    <EmptyDescription>
                      {tTable('state.emptyDescription')}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => {
              const role = row.original;
              const isSelected = selectedIds.has(role.roleId);
              return (
                <TableRow
                  key={row.id}
                  className={cn(
                    'transition-colors hover:bg-muted/60',
                    isSelected && 'bg-emerald-50/70 dark:bg-emerald-500/20',
                  )}
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
              );
            })
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
