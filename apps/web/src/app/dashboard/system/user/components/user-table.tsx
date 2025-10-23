'use client';

import { useEffect, useRef, useState } from 'react';
import { KeyRound, MoreHorizontal, Pencil, Trash2, UserCog } from 'lucide-react';

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

import type { User } from '../type';
import {
  formatPhoneNumber,
  getAvatarFallback,
  getCompanyLabel,
  getDisplayName,
  getEmailLabel,
  getRoleLabel,
  STATUS_META,
} from './utils';

interface UserTableProps {
  rows: User[];
  headerCheckboxState: boolean | 'indeterminate';
  onToggleSelectAll: (checked: boolean) => void;
  selectedIds: Set<number>;
  onToggleSelect: (userId: number, checked: boolean) => void;
  onEdit: (user: User) => void;
  onResetPassword?: (user: User) => void;
  onChangeRole?: (user: User) => void;
  onDelete: (user: User) => void;
  isLoading?: boolean;
  isError?: boolean;
}

interface RowActionsProps {
  user: User;
  onEdit: (user: User) => void;
  onResetPassword?: (user: User) => void;
  onChangeRole?: (user: User) => void;
  onDelete: (user: User) => void;
  disableDelete: boolean;
}

function RowActions({
  user,
  onEdit,
  onResetPassword,
  onChangeRole,
  onDelete,
  disableDelete,
}: RowActionsProps) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelScheduledClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelScheduledClose();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, 120);
  };

  const handleSelect =
    (callback?: (user: User) => void) =>
    (event: Event) => {
      event.preventDefault();
      if (callback) {
        callback(user);
      }
      cancelScheduledClose();
      setOpen(false);
    };

  const handleDeleteSelect = (event: Event) => {
    event.preventDefault();
    if (!disableDelete) {
      onDelete(user);
    }
    cancelScheduledClose();
    setOpen(false);
  };

  const handleMouseEnter = () => {
    cancelScheduledClose();
    setOpen(true);
  };
  const handleMouseLeave = () => {
    scheduleClose();
  };

  useEffect(() => () => cancelScheduledClose(), []);

  useEffect(() => {
    if (!open) {
      cancelScheduledClose();
    }
  }, [open]);

  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2.5 text-sm font-medium"
        onClick={() => onEdit(user)}
      >
        <Pencil className="mr-1.5 size-3.5" />
        修改
      </Button>
      <DropdownMenu
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            cancelScheduledClose();
          }
          setOpen(nextOpen);
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            aria-label="更多操作"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-40"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <DropdownMenuItem
            disabled={!onResetPassword}
            onSelect={handleSelect(onResetPassword)}
          >
            <KeyRound className="mr-2 size-4" />
            重置密码
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!onChangeRole}
            onSelect={handleSelect(onChangeRole)}
          >
            <UserCog className="mr-2 size-4" />
            修改角色
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
  onChangeRole,
  onDelete,
  isLoading,
  isError,
}: UserTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="w-12">
              <Checkbox
                aria-label="选择全部"
                checked={headerCheckboxState}
                onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
              />
            </TableHead>
            <TableHead className="min-w-[220px]">姓名</TableHead>
            <TableHead className="min-w-[160px]">手机号</TableHead>
            <TableHead className="min-w-[180px]">所属部门</TableHead>
            <TableHead className="min-w-[160px]">角色</TableHead>
            <TableHead className="w-[120px]">状态</TableHead>
            <TableHead className="w-[120px] text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                正在加载用户...
              </TableCell>
            </TableRow>
          ) : isError ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-sm text-destructive">
                加载失败，请稍后再试。
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                暂无数据
              </TableCell>
            </TableRow>
          ) : (
            rows.map((user) => {
              const displayName = getDisplayName(user);
              const phoneLabel = formatPhoneNumber(user.phonenumber);
              const companyLabel = getCompanyLabel(user);
              const roleLabel = getRoleLabel(user);
              const emailLabel = getEmailLabel(user);
              const statusMeta = STATUS_META[user.status as keyof typeof STATUS_META] ?? STATUS_META['1'];
              const isSelected = selectedIds.has(user.userId);
              const isSuperAdmin = user.userId === 1 || user.userName === 'admin';

              return (
                <TableRow
                  key={user.userId}
                  className={cn(
                    'transition-colors hover:bg-muted/60',
                    isSelected && 'bg-emerald-50/70',
                  )}
                >
                  <TableCell className="w-12 align-middle">
                    <Checkbox
                      aria-label={`选择 ${displayName}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => onToggleSelect(user.userId, checked === true)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border/60 shadow-sm">
                        {user.avatar ? <AvatarImage src={user.avatar} alt={displayName} /> : null}
                        <AvatarFallback>{getAvatarFallback(user)}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">{displayName}</p>
                        <p className="text-xs text-muted-foreground">{emailLabel}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{phoneLabel}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{companyLabel}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{roleLabel}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        'border-transparent px-2.5 py-1 text-xs font-medium capitalize',
                        statusMeta.badgeClass,
                      )}
                    >
                      {statusMeta.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      user={user}
                      onEdit={onEdit}
                      onResetPassword={onResetPassword}
                      onChangeRole={onChangeRole}
                      onDelete={onDelete}
                      disableDelete={isSuperAdmin}
                    />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
