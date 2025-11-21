'use client';

import {
  PINNED_ACTION_COLUMN_META,
  PINNED_TABLE_CLASS,
} from '@/components/table/pinned-actions';
import { EllipsisText } from '@/components/table/ellipsis-text';
import { TableLoadingSkeleton } from '@/components/table/table-loading-skeleton';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { usePermissions } from '@/hooks/use-permissions';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { KeyRound, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

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

const ACTION_COLUMN_META = {
  headerClassName: 'sticky right-0 z-20 w-[52px] bg-card text-right',
  cellClassName:
    'sticky right-0 z-10 w-[52px] bg-card text-right group-hover:bg-muted/50',
};

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
  const t = useTranslations('UserManagement');
  const showDropdown = canEdit || canResetPassword || canDelete;
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!showDropdown) {
    return null;
  }

  return (
    <div className="flex justify-end ">
      {isMobile ? (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-7 sm:size-8 hover:text-primary cursor-pointer"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              aria-label={t('table.actions.more')}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-auto w-full max-w-full rounded-t-2xl border-t p-0"
          >
            <SheetHeader className="px-4 pb-2 pt-3 text-left">
              <SheetTitle>{t('table.columns.actions')}</SheetTitle>
              <SheetDescription>{t('table.actions.more')}</SheetDescription>
            </SheetHeader>
            <SheetFooter className="mt-0 flex-col gap-2 px-4 pb-4">
              {canEdit ? (
                <Button
                  variant="secondary"
                  className="w-full justify-between"
                  onClick={() => {
                    onEdit(user);
                    setSheetOpen(false);
                  }}
                >
                  <span className="flex items-center gap-2">
                    <Pencil className="size-4" />
                    {t('table.actions.edit')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t('dialogs.editDescription')}
                  </span>
                </Button>
              ) : null}
              {canResetPassword ? (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    onResetPassword?.(user);
                    setSheetOpen(false);
                  }}
                  disabled={!onResetPassword}
                >
                  <KeyRound className="size-4" />
                  {t('table.actions.resetPassword')}
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  variant="destructive"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    if (disableDelete) return;
                    onDelete(user);
                    setSheetOpen(false);
                  }}
                  disabled={disableDelete}
                >
                  <Trash2 className="size-4" />
                  {t('table.actions.delete')}
                </Button>
              ) : null}
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-7 sm:size-8 hover:text-primary cursor-pointer"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              aria-label={t('table.actions.more')}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {canEdit ? (
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  onEdit(user);
                }}
              >
                <Pencil className="mr-2 size-4" />
                {t('table.actions.edit')}
              </DropdownMenuItem>
            ) : null}
            {canResetPassword ? (
              <DropdownMenuItem
                disabled={!onResetPassword}
                onSelect={(event) => {
                  event.preventDefault();
                  onResetPassword?.(user);
                }}
              >
                <KeyRound className="mr-2 size-4" />
                {t('table.actions.resetPassword')}
              </DropdownMenuItem>
            ) : null}
            {canDelete ? <DropdownMenuSeparator /> : null}
            {canDelete ? (
              <DropdownMenuItem
                disabled={disableDelete}
                onSelect={(event) => {
                  event.preventDefault();
                  if (!disableDelete) {
                    onDelete(user);
                  }
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 size-4" />
                {t('table.actions.delete')}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
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
  const t = useTranslations('UserManagement');
  const columnHelper = useMemo(() => createColumnHelper<User>(), []);
  const { hasPermission } = usePermissions();
  const canEditUser = hasPermission('system:user:edit');
  const canResetPassword = hasPermission('system:user:resetPwd');
  const canDeleteUser = hasPermission('system:user:remove');
  const showRowActions = canEditUser || canResetPassword || canDeleteUser;
  const defaultName = t('table.defaultName');
  const defaultRole = t('table.defaultRole');
  const statusLabels = {
    all: t('filters.statusTabs.all'),
    '0': t('status.enabled'),
    '1': t('status.disabled'),
  } as const;

  const columns = useMemo(() => {
    const baseColumns = [
      columnHelper.display({
        id: 'select',
        header: () => (
          <Checkbox
            aria-label={t('table.selection.selectAll')}
            checked={headerCheckboxState}
            onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
          />
        ),
        cell: ({ row }) => {
          const user = row.original;
          const label = getAccountLabel(
            user,
            getDisplayName(user, defaultName),
          );
          const isSelected = selectedIds.has(user.userId);
          return (
            <Checkbox
              aria-label={t('table.selection.selectUser', { target: label })}
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
        header: () => t('table.columns.account'),
        cell: ({ row }) => {
          const user = row.original;
          const displayName = getDisplayName(user, defaultName);
          const accountLabel = getAccountLabel(user, displayName);
          const emailLabel = getEmailLabel(user);

          return (
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="h-10 w-10 border border-border/60 ">
                {user.avatar ? (
                  <AvatarImage src={user.avatar} alt={displayName} />
                ) : null}
                <AvatarFallback>
                  {getAvatarFallback(user, defaultName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-1">
                <EllipsisText
                  value={accountLabel}
                  className="text-sm font-medium text-foreground max-w-[200px]"
                />
                <EllipsisText
                  value={emailLabel}
                  className="text-xs text-muted-foreground max-w-[220px]"
                  placeholder="—"
                />
              </div>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[150px] md:min-w-[190px]',
          cellClassName: 'min-w-[170px] max-w-[190px]',
        },
      }),
      columnHelper.display({
        id: 'nickname',
        header: () => t('table.columns.nickname'),
        cell: ({ row }) => {
          const user = row.original;
          const nickName = user.nickName?.trim();
          return (
            <EllipsisText
              value={nickName && nickName.length > 0 ? nickName : undefined}
              className="text-sm text-muted-foreground max-w-[140px]"
            />
          );
        },
        meta: {
          headerClassName: 'min-w-[110px] md:min-w-[140px]',
          cellClassName: 'max-w-[150px]',
        },
      }),
      columnHelper.display({
        id: 'phone',
        header: () => t('table.columns.phone'),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <EllipsisText
              value={formatPhoneNumber(user.phonenumber)}
              className="text-sm text-muted-foreground max-w-[130px]"
            />
          );
        },
        meta: {
          headerClassName:
            'hidden sm:table-cell min-w-[100px] md:min-w-[140px]',
          cellClassName: 'hidden sm:table-cell max-w-[140px]',
        },
      }),
      columnHelper.display({
        id: 'department',
        header: () => t('table.columns.dept'),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <EllipsisText
              value={getCompanyLabel(user)}
              className="text-sm text-muted-foreground max-w-[150px]"
            />
          );
        },
        meta: {
          headerClassName: 'min-w-[120px] md:min-w-[160px]',
          cellClassName: 'max-w-[170px]',
        },
      }),
      columnHelper.display({
        id: 'role',
        header: () => t('table.columns.roles'),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <EllipsisText
              value={getRoleLabel(user, defaultRole)}
              className="text-sm text-muted-foreground max-w-[140px]"
            />
          );
        },
        meta: {
          headerClassName:
            'hidden sm:table-cell min-w-[110px] md:min-w-[150px]',
          cellClassName: 'hidden sm:table-cell max-w-[160px]',
        },
      }),
      columnHelper.display({
        id: 'status',
        header: () => t('table.columns.status'),
        cell: ({ row }) => {
          const user = row.original;
          const statusKey =
            (user.status as keyof typeof statusLabels) ?? ('1' as const);
          const statusMeta =
            STATUS_META[user.status as keyof typeof STATUS_META] ??
            STATUS_META['1'];
          const statusLabel = statusLabels[statusKey] ?? statusLabels['1'];
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
          headerClassName: 'w-[90px]',
        },
      }),
    ];

    if (showRowActions) {
      baseColumns.push(
        columnHelper.display({
          id: 'actions',
          header: () => (
            <span className="block text-right">
              {t('table.columns.actions')}
            </span>
          ),
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
                canEdit={canEditUser}
                canResetPassword={canResetPassword}
                canDelete={canDeleteUser}
              />
            );
          },
          enableSorting: false,
          meta: { ...PINNED_ACTION_COLUMN_META, ...ACTION_COLUMN_META },
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
    defaultName,
    defaultRole,
    statusLabels,
    t,
  ]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    <div className="w-full overflow-x-auto scrollbar-thin">
      <Table
        className={`${PINNED_TABLE_CLASS} min-w-[600px] sm:min-w-[760px] table-fixed`}
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
                {t('table.state.error')}
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
                    <EmptyTitle>{t('table.state.emptyTitle')}</EmptyTitle>
                    <EmptyDescription>
                      {t('table.state.emptyDescription')}
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
