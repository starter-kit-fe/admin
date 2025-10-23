import { Pencil, Trash2 } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  onDelete: (user: User) => void;
  isLoading?: boolean;
  isError?: boolean;
}

export function UserTable({
  rows,
  headerCheckboxState,
  onToggleSelectAll,
  selectedIds,
  onToggleSelect,
  onEdit,
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
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => onEdit(user)}
                      >
                        <Pencil className="size-4" />
                        <span className="sr-only">编辑</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(user)}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">删除</span>
                      </Button>
                    </div>
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
