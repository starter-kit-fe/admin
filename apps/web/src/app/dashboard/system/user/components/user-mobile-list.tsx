'use client';

import type { KeyboardEvent } from 'react';
import { KeyRound, Pencil, Trash2 } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

import type { User } from '../type';
import {
  STATUS_META,
  formatPhoneNumber,
  getAccountLabel,
  getAvatarFallback,
  getCompanyLabel,
  getDisplayName,
  getEmailLabel,
  getRoleLabel,
} from './utils';

interface UserMobileListProps {
  rows: User[];
  selectedIds: Set<number>;
  onToggleSelect: (userId: number, checked: boolean) => void;
  onEdit: (user: User) => void;
  onResetPassword?: (user: User) => void;
  onDelete: (user: User) => void;
  isLoading?: boolean;
  isError?: boolean;
}

export function UserMobileList({
  rows,
  selectedIds,
  onToggleSelect,
  onEdit,
  onResetPassword,
  onDelete,
  isLoading,
  isError,
}: UserMobileListProps) {
  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        正在加载用户...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12 text-center text-sm text-destructive">
        加载失败，请稍后再试。
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        暂无数据
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.map((user) => {
        const isSelected = selectedIds.has(user.userId);
        const displayName = getDisplayName(user);
        const accountLabel = getAccountLabel(user, displayName);
        const trimmedNick = user.nickName?.trim();
        const nicknameLabel = trimmedNick && trimmedNick.length > 0 ? trimmedNick : '—';
        const emailLabel = getEmailLabel(user);
        const statusMeta =
          STATUS_META[user.status as keyof typeof STATUS_META] ?? STATUS_META['1'];
        const disableDelete = user.userId === 1 || user.userName === 'admin';

        const handleCardActivate = () => {
          onEdit(user);
        };

        const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleCardActivate();
          }
        };

        return (
          <article
            key={user.userId}
            data-selected={isSelected}
            className={cn(
              'relative cursor-pointer overflow-hidden rounded-[28px] bg-gradient-to-b from-white via-white to-slate-50/90 p-4 shadow-[0_12px_35px_rgba(15,23,42,0.08)] transition-transform duration-200 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900',
              'before:absolute before:inset-0 before:-z-10 before:rounded-[32px] before:bg-gradient-to-r before:from-emerald-300/20 before:via-transparent before:to-transparent',
              isSelected && 'scale-[1.01] before:from-emerald-400/30',
            )}
            role="button"
            tabIndex={0}
            onClick={handleCardActivate}
            onKeyDown={handleCardKeyDown}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                aria-label={`选择 ${accountLabel}`}
                checked={isSelected}
                onCheckedChange={(checked) => onToggleSelect(user.userId, checked === true)}
                className="mt-2"
                onClick={(event) => event.stopPropagation()}
              />
              <Avatar className="h-12 w-12 border border-border/40 bg-white/80 shadow">
                {user.avatar ? (
                  <AvatarImage src={user.avatar} alt={displayName} />
                ) : null}
                <AvatarFallback>{getAvatarFallback(user)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-foreground">{accountLabel}</p>
                    <p className="text-sm text-muted-foreground">{emailLabel}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'border-0 px-2 py-0.5 text-xs font-semibold',
                      statusMeta.badgeClass,
                    )}
                  >
                    {statusMeta.label}
                  </Badge>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <div>
                    <dt className="font-medium text-foreground">角色</dt>
                    <dd>{getRoleLabel(user)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">部门</dt>
                    <dd>{getCompanyLabel(user)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">昵称</dt>
                    <dd>{nicknameLabel}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">手机号</dt>
                    <dd>{formatPhoneNumber(user.phonenumber)}</dd>
                  </div>
                </dl>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5 rounded-2xl font-semibold"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(user);
                  }}
                >
                  <Pencil className="size-3.5" />
                  编辑
                </Button>
                {onResetPassword ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="gap-1.5 rounded-2xl font-semibold"
                    onClick={(event) => {
                      event.stopPropagation();
                      onResetPassword(user);
                    }}
                  >
                    <KeyRound className="size-3.5" />
                    重置密码
                  </Button>
                ) : (
                  <span />
                )}
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="w-full gap-1.5 rounded-2xl font-semibold"
                onClick={(event) => {
                  event.stopPropagation();
                  if (!disableDelete) {
                    onDelete(user);
                  }
                }}
                disabled={disableDelete}
              >
                <Trash2 className="size-3.5" />
                删除
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
