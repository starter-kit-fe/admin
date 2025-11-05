import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

import type { Role } from '../type';

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
  '0': { label: '正常', badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  '1': { label: '停用', badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-500/30' },
};

const DATA_SCOPE_LABELS: Record<string, string> = {
  '1': '全部数据权限',
  '2': '自定义数据权限',
  '3': '本部门数据',
  '4': '本部门及以下',
  '5': '仅本人数据',
};

function getDataScopeLabel(scope: string) {
  return DATA_SCOPE_LABELS[scope] ?? '全部数据权限';
}

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

function RoleRowActions({ role, onEdit, onDelete }: { role: Role; onEdit: (role: Role) => void; onDelete: (role: Role) => void }) {
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="sm" className="h-8 px-2.5 text-sm font-medium" onClick={() => onEdit(role)}>
        <Pencil className="mr-1.5 size-3.5" />
        编辑
      </Button>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
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
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={(event) => {
              event.preventDefault();
              onDelete(role);
            }}
          >
            <Trash2 className="mr-2 size-4" /> 删除角色
          </DropdownMenuItem>
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
  const columnHelper = createColumnHelper<Role>();

  const columns = [
    columnHelper.display({
      id: 'select',
      header: () => (
        <Checkbox aria-label="选择全部" checked={headerCheckboxState} onCheckedChange={(checked) => onToggleSelectAll(checked === true)} />
      ),
      cell: ({ row }) => {
        const role = row.original;
        const isSelected = selectedIds.has(role.roleId);
        return (
          <Checkbox
            aria-label={`选择 ${role.roleName}`}
            checked={isSelected}
            onCheckedChange={(checked) => onToggleSelect(role.roleId, checked === true)}
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
          <span className="text-sm font-medium text-foreground">{row.original.roleName}</span>
          <span className="text-xs text-muted-foreground">#{row.original.roleId}</span>
        </div>
      ),
      meta: { headerClassName: 'min-w-[200px]' },
    }),
    columnHelper.accessor('roleKey', {
      header: '权限字符',
      cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{getValue()}</span>,
      meta: { headerClassName: 'min-w-[180px]' },
    }),
    columnHelper.accessor('roleSort', {
      header: '显示顺序',
      cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{getValue()}</span>,
      meta: { headerClassName: 'w-[120px]' },
    }),
    columnHelper.accessor('dataScope', {
      header: '数据权限',
      cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{getDataScopeLabel(getValue())}</span>,
      meta: { headerClassName: 'min-w-[180px]' },
    }),
    columnHelper.accessor('status', {
      header: '状态',
      cell: ({ getValue }) => {
        const meta = STATUS_META[getValue()] ?? STATUS_META['1'];
        return (
          <Badge variant="outline" className={cn('border-transparent px-2.5 py-1 text-xs font-medium capitalize', meta.badgeClass)}>
            {meta.label}
          </Badge>
        );
      },
      enableSorting: false,
      meta: { headerClassName: 'w-[120px]' },
    }),
    columnHelper.accessor('createTime', {
      header: '创建时间',
      cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{getDateTimeLabel(getValue())}</span>,
      meta: { headerClassName: 'min-w-[180px]' },
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <span className="block text-right">操作</span>,
      cell: ({ row }) => <RoleRowActions role={row.original} onEdit={onEdit} onDelete={onDelete} />,
      enableSorting: false,
      meta: { headerClassName: 'w-[140px] text-right', cellClassName: 'text-right' },
    }),
  ];

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-sm dark:border-border/40">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/40">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className={cn(header.column.columnDef.meta?.headerClassName as string | undefined)}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={visibleColumnCount} className="h-24 text-center text-sm text-muted-foreground">
                正在加载角色...
              </TableCell>
            </TableRow>
          ) : isError ? (
            <TableRow>
              <TableCell colSpan={visibleColumnCount} className="h-24 text-center text-sm text-destructive">
                加载失败，请稍后再试。
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={visibleColumnCount} className="h-24 text-center text-sm text-muted-foreground">
                暂无数据
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
                    isSelected && 'bg-emerald-50/70 dark:bg-emerald-500/20'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cn(cell.column.columnDef.meta?.cellClassName as string | undefined)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
