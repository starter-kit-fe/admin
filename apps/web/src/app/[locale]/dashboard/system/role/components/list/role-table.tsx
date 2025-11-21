'use client';

import {
  PINNED_ACTION_COLUMN_META,
  PINNED_TABLE_CLASS,
} from '@/components/table/pinned-actions';
import { TableLoadingSkeleton } from '@/components/table/table-loading-skeleton';
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
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { Role } from '../../type';

const ACTION_COLUMN_META = {
  headerClassName: 'sticky right-0 z-20 w-[52px] bg-card text-right',
  cellClassName:
    'sticky right-0 z-10 w-[52px] bg-card text-right group-hover:bg-muted/50',
};

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
    label: string;
    badgeClass: string;
  }
> = {
  '0': {
    label: '正常',
    badgeClass: 'bg-primary/10 text-primary',
  },
  '1': {
    label: '停用',
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
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (!canEdit && !canDelete) {
    return null;
  }

  const trigger = (
    <Button
      variant="ghost"
      size="icon-sm"
      className="size-7 sm:size-8"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      aria-label="更多操作"
      disabled={!canEdit && !canDelete}
    >
      <MoreHorizontal className="size-4" />
    </Button>
  );

  return (
    <div className="flex justify-end">
      {isMobile ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>{trigger}</SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-auto w-full max-w-full rounded-t-2xl border-t p-0"
          >
          <SheetHeader className="px-4 pb-2 pt-3 text-left">
            <SheetTitle>操作</SheetTitle>
            <SheetDescription>为该角色选择要执行的操作。</SheetDescription>
          </SheetHeader>
          <SheetFooter className="mt-0 flex-row items-center justify-between gap-3 px-4 pb-4">
            {canEdit ? (
              <Button
                variant="secondary"
                className="flex-1 justify-between"
                onClick={() => {
                  onEdit(role);
                  setOpen(false);
                }}
              >
                  <span className="flex items-center gap-2">
                    <Pencil className="size-4" />
                    编辑
                  </span>
                  <span className="text-xs text-muted-foreground">
                    修改角色
                  </span>
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  variant="destructive"
                  className="flex-1 justify-center gap-2"
                  onClick={() => {
                    onDelete(role);
                    setOpen(false);
                  }}
                >
                  <Trash2 className="size-4" /> 删除角色
                </Button>
              ) : null}
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {canEdit ? (
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  onEdit(role);
                }}
              >
                <Pencil className="mr-2 size-4" />
                编辑
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
                <Trash2 className="mr-2 size-4" /> 删除角色
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
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
            aria-label="选择全部"
            checked={headerCheckboxState}
            onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
          />
        ),
        cell: ({ row }) => {
          const role = row.original;
          const isSelected = selectedIds.has(role.roleId);
          return (
            <Checkbox
              aria-label={`选择 ${role.roleName}`}
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
        header: '角色名称',
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
        meta: { headerClassName: 'min-w-[140px] md:min-w-[200px]' },
      }),
      columnHelper.accessor('roleKey', {
        header: '权限字符',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue()}</span>
        ),
        meta: {
          headerClassName: 'min-w-[140px] md:min-w-[180px]',
          cellClassName: 'max-w-[180px]',
        },
      }),
      columnHelper.accessor('status', {
        header: '状态',
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
              {meta.label}
            </Badge>
          );
        },
        enableSorting: false,
        meta: { headerClassName: 'w-[120px]' },
      }),
      columnHelper.accessor('createTime', {
        header: '创建时间',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {getDateTimeLabel(getValue())}
          </span>
        ),
        meta: {
          headerClassName:
            'hidden sm:table-cell min-w-[140px] md:min-w-[180px]',
          cellClassName: 'hidden sm:table-cell max-w-[200px]',
        },
      }),
    ];

    if (showRowActions) {
      baseColumns.push(
        columnHelper.display({
          id: 'actions',
          header: () => <span className="block text-right">操作</span>,
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
          meta: { ...PINNED_ACTION_COLUMN_META, ...ACTION_COLUMN_META },
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
  ]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card  dark:border-border/40">
      <Table
        className={`${PINNED_TABLE_CLASS} min-w-[620px] sm:min-w-[760px] table-fixed`}
      >
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
            <TableLoadingSkeleton columns={visibleColumnCount} />
          ) : isError ? (
            <TableRow>
              <TableCell
                colSpan={visibleColumnCount}
                className="h-24 text-center text-sm text-destructive"
              >
                加载失败，请稍后再试。
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
                    <EmptyTitle>暂无角色数据</EmptyTitle>
                    <EmptyDescription>
                      创建角色后即可在此配置权限和成员。
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
                    'group transition-colors hover:bg-muted/60',
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
