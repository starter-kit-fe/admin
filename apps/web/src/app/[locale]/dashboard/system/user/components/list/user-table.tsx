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
import { useTranslations } from 'next-intl';

import type { User } from '../../type';
import { usePermissions } from '@/hooks/use-permissions';

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
  canEdit: boolean;
  canResetPassword: boolean;
  canDelete: boolean;
}

function RowActions({
  user,
  onEdit,
  onResetPassword,
  onDelete,
  disableDelete,
  canEdit,
  canResetPassword,
  canDelete,
}: RowActionsProps) {
  const tTable = useTranslations('UserManagement.table');
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

  const showDropdown = canResetPassword || canDelete;

  if (!canEdit && !showDropdown) {
    return null;
  }

  return (
    <div className="flex justify-end gap-1.5">
      {canEdit ? (
        <Button
          variant="ghost"
          size="sm"
          className="gap-0.5 px-2.5 hover:text-primary cursor-pointer"
          onClick={() => onEdit(user)}
        >
          <Pencil className="mr-1.5 size-3" />
          {tTable('actions.edit')}
        </Button>
      ) : null}
      {showDropdown ? (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 hover:text-primary cursor-pointer"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              aria-label={tTable('actions.more')}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {canResetPassword ? (
              <>
                <DropdownMenuItem
                  disabled={!onResetPassword}
                  onSelect={handleSelect(onResetPassword)}
                >
                  <KeyRound className="mr-2 size-4" />
                  {tTable('actions.resetPassword')}
                </DropdownMenuItem>
                {canDelete ? <DropdownMenuSeparator /> : null}
              </>
            ) : null}
            {canDelete ? (
              <DropdownMenuItem
                disabled={disableDelete}
                onSelect={handleDeleteSelect}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 size-4" />
                {tTable('actions.delete')}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
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
  const tTable = useTranslations('UserManagement.table');
  const tStatus = useTranslations('UserManagement.status');
  const columnHelper = useMemo(() => createColumnHelper<User>(), []);
  const { hasPermission } = usePermissions();
  const canEditUser = hasPermission('system:user:edit');
  const canResetPassword = hasPermission('system:user:resetPwd');
  const canDeleteUser = hasPermission('system:user:remove');
  const showRowActions = canEditUser || canResetPassword || canDeleteUser;

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
          const user = row.original;
          const label = getAccountLabel(user, getDisplayName(user));
          const isSelected = selectedIds.has(user.userId);
          return (
            <Checkbox
              aria-label={tTable('selection.selectUser', { target: label })}
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
        header: () => tTable('columns.account'),
        cell: ({ row }) => {
          const user = row.original;
          const accountLabel = getAccountLabel(user);
          const displayName = getDisplayName(user, tTable('defaultName'));
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
        header: () => tTable('columns.nickname'),
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
        header: () => tTable('columns.phone'),
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
        header: () => tTable('columns.dept'),
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
        header: () => tTable('columns.roles'),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <span className="text-sm text-muted-foreground">
              {getRoleLabel(user, tTable('defaultRole'))}
            </span>
          );
        },
        meta: {
          headerClassName: 'min-w-[160px]',
        },
      }),
      columnHelper.display({
        id: 'status',
        header: () => tTable('columns.status'),
        cell: ({ row }) => {
          const user = row.original;
          const statusMeta =
            STATUS_META[user.status as keyof typeof STATUS_META] ??
            STATUS_META['1'];
          const statusLabel = tStatus(statusMeta.labelKey);
          return (
            <Badge
              variant="outline"
              className={cn(
                'border-transparent px-2.5 py-1 text-xs font-medium capitalize',
                statusMeta.badgeClass,
              )}
            >
              {statusLabel}
            </Badge>
          );
        },
        enableSorting: false,
        meta: {
          headerClassName: 'w-[120px]',
        },
      }),
    ];

    if (showRowActions) {
      baseColumns.push(
        columnHelper.display({
          id: 'actions',
          header: () => (
            <span className="block text-right">{tTable('columns.actions')}</span>
          ),
          cell: ({ row }) => {
            const user = row.original;
            const isSuperAdmin =
              user.userId === 1 || user.userName === 'admin';
            return (
              <RowActions
                user={user}
                onEdit={onEdit}
                onResetPassword={onResetPassword}
                onDelete={onDelete}
                disableDelete={isSuperAdmin}
                canEdit={canEditUser}
                canResetPassword={canResetPassword}
                canDelete={canDeleteUser}
              />
            );
          },
          enableSorting: false,
          meta: {
            headerClassName: 'w-[120px] text-right',
            cellClassName: 'text-right',
          },
        }),
      );
    }

    return baseColumns;
  }, [
    canDeleteUser,
    canEditUser,
    canResetPassword,
    columnHelper,
    headerCheckboxState,
    onDelete,
    onEdit,
    onResetPassword,
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
