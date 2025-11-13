'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { KeyRound, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useMemo } from 'react';

import type { User } from '../../type';
import {
  STATUS_META,
  formatPhoneNumber,
  getAccountLabel,
  getAvatarFallback,
  getCompanyLabel,
  getDisplayName,
  getEmailLabel,
  getRoleLabel,
} from '../utils';

interface UserTableProps {
  rows: User[];
  headerCheckboxState: boolean | 'indeterminate';
  onToggleSelectAll: (checked: boolean) => void;
  selectedIds: Set<number>;
  onToggleSelect: (userId: number, checked: boolean) => void;
  onEdit: (user: User) => void;
  onResetPassword?: (user: User) => void;
  onDelete: (user: User) => void;
  isLoading?: boolean;
  isError?: boolean;
}

interface RowActionsProps {
  user: User;
  onEdit: (user: User) => void;
  onResetPassword?: (user: User) => void;
  onDelete: (user: User) => void;
  disableDelete: boolean;
}

function RowActions({
  user,
  onEdit,
  onResetPassword,
  onDelete,
  disableDelete,
}: RowActionsProps) {
  const handleSelect = (callback?: (user: User) => void) => () => {
    if (callback) {
      callback(user);
    }
  };

  const handleDeleteSelect = () => {
    if (!disableDelete) {
      onDelete(user);
    }
  };

  return (
    <div className="flex justify-end">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 hover:text-primary cursor-pointer"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            aria-label="更多操作"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={handleSelect(onEdit)}>
            <Pencil className="mr-2 size-4" />
            修改
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!onResetPassword}
            onSelect={handleSelect(onResetPassword)}
          >
            <KeyRound className="mr-2 size-4" />
            重置密码
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={disableDelete}
            onSelect={handleDeleteSelect}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function UserTable({
  rows,
  headerCheckboxState,
  onToggleSelectAll,
  selectedIds,
  onToggleSelect,
  onEdit,
  onResetPassword,
  onDelete,
  isLoading,
  isError,
}: UserTableProps) {
  const columnHelper = useMemo(() => createColumnHelper<User>(), []);
  const columns = useMemo(
    () => [
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
          const user = row.original;
          const label = getAccountLabel(user, getDisplayName(user));
          const isSelected = selectedIds.has(user.userId);
          return (
            <Checkbox
              aria-label={`选择 ${label}`}
              checked={isSelected}
              onCheckedChange={(checked) =>
                onToggleSelect(user.userId, checked === true)
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
      columnHelper.display({
        id: 'account',
        header: () => '账号',
        cell: ({ row }) => {
          const user = row.original;
          const accountLabel = getAccountLabel(user);
          const displayName = getDisplayName(user);
          const emailLabel = getEmailLabel(user);

          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-border/60 ">
                {user.avatar ? (
                  <AvatarImage src={user.avatar} alt={displayName} />
                ) : null}
                <AvatarFallback>{getAvatarFallback(user)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {accountLabel}
                </p>
                <p className="text-xs text-muted-foreground">{emailLabel}</p>
              </div>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[220px]',
        },
      }),
      columnHelper.display({
        id: 'nickname',
        header: () => '昵称',
        cell: ({ row }) => {
          const user = row.original;
          const nickName = user.nickName?.trim();
          return (
            <span className="text-sm text-muted-foreground">
              {nickName && nickName.length > 0 ? nickName : '—'}
            </span>
          );
        },
        meta: {
          headerClassName: 'min-w-[160px]',
        },
      }),
      columnHelper.display({
        id: 'phone',
        header: () => '手机号',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <span className="text-sm text-muted-foreground">
              {formatPhoneNumber(user.phonenumber)}
            </span>
          );
        },
        meta: {
          headerClassName: 'min-w-[160px]',
        },
      }),
      columnHelper.display({
        id: 'department',
        header: () => '所属部门',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <span className="text-sm text-muted-foreground">
              {getCompanyLabel(user)}
            </span>
          );
        },
        meta: {
          headerClassName: 'min-w-[180px]',
        },
      }),
      columnHelper.display({
        id: 'role',
        header: () => '角色',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <span className="text-sm text-muted-foreground">
              {getRoleLabel(user)}
            </span>
          );
        },
        meta: {
          headerClassName: 'min-w-[160px]',
        },
      }),
      columnHelper.display({
        id: 'status',
        header: () => '状态',
        cell: ({ row }) => {
          const user = row.original;
          const statusMeta =
            STATUS_META[user.status as keyof typeof STATUS_META] ??
            STATUS_META['1'];
          return (
            <Badge
              variant="outline"
              className={cn(
                'border-transparent px-2.5 py-1 text-xs font-medium capitalize',
                statusMeta.badgeClass,
              )}
            >
              {statusMeta.label}
            </Badge>
          );
        },
        enableSorting: false,
        meta: {
          headerClassName: 'w-[120px]',
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="block text-right">操作</span>,
        cell: ({ row }) => {
          const user = row.original;
          const isSuperAdmin = user.userId === 1 || user.userName === 'admin';
          return (
            <RowActions
              user={user}
              onEdit={onEdit}
              onResetPassword={onResetPassword}
              onDelete={onDelete}
              disableDelete={isSuperAdmin}
            />
          );
        },
        enableSorting: false,
        meta: {
          headerClassName: 'w-[120px] text-right',
          cellClassName: 'text-right',
        },
      }),
    ],
    [
      columnHelper,
      headerCheckboxState,
      onDelete,
      onEdit,
      onResetPassword,
      onToggleSelect,
      onToggleSelectAll,
      selectedIds,
    ],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    <div className="overflow-x-auto">
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
                正在加载用户...
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
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={visibleColumnCount}
                className="h-48 text-center align-middle"
              >
                <Empty className="border-0 bg-transparent p-4">
                  <EmptyHeader>
                    <EmptyTitle>暂无用户数据</EmptyTitle>
                    <EmptyDescription>
                      创建用户后可在此管理详情与权限。
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => {
              const user = row.original;
              const isSelected = selectedIds.has(user.userId);
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
