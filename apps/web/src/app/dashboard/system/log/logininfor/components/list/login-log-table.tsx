'use client';

import { InlineLoading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Trash2 } from 'lucide-react';

import type { LoginLog } from '../../type';
import {
  getLoginStatusBadgeVariant,
  getLoginStatusLabel,
} from '../../utils';

interface LoginLogTableProps {
  rows: LoginLog[];
  isLoading?: boolean;
  isError?: boolean;
  unlockPending?: boolean;
  onUnlock: (id: number) => void;
  onDelete: (log: LoginLog) => void;
}

export function LoginLogTable({
  rows,
  isLoading,
  isError,
  unlockPending,
  onUnlock,
  onDelete,
}: LoginLogTableProps) {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex min-h-[320px] items-center justify-center">
          <InlineLoading label="加载中" />
        </div>
      );
    }

    if (isError) {
      return (
        <div className="py-10 text-center text-sm text-destructive">
          加载登录日志失败，请稍后再试。
        </div>
      );
    }

    if (rows.length === 0) {
      return (
        <Empty className="mx-auto my-6 min-h-[200px] max-w-xl border border-dashed border-border/60">
          <EmptyHeader>
            <EmptyTitle>暂无登录日志数据</EmptyTitle>
            <EmptyDescription>
              当有新的登录行为时会自动汇总在此。
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[160px]">登录账号</TableHead>
              <TableHead className="min-w-[140px]">登录 IP</TableHead>
              <TableHead className="min-w-[200px]">登录地点</TableHead>
              <TableHead className="min-w-[160px]">客户端</TableHead>
              <TableHead className="min-w-[100px]">状态</TableHead>
              <TableHead className="min-w-[220px]">提示信息</TableHead>
              <TableHead className="min-w-[160px]">登录时间</TableHead>
              <TableHead className="min-w-[160px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.infoId}>
                <TableCell className="font-medium text-foreground">
                  {row.userName || '-'}
                </TableCell>
                <TableCell>{row.ipaddr || '-'}</TableCell>
                <TableCell>{row.loginLocation || '-'}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{row.browser || '-'}</span>
                    <span className="text-xs text-muted-foreground">
                      {row.os || '-'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getLoginStatusBadgeVariant(row.status)}>
                    {getLoginStatusLabel(row.status)}
                  </Badge>
                </TableCell>
                <TableCell>{row.msg || '-'}</TableCell>
                <TableCell>{row.loginTime ?? '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={unlockPending}
                      onClick={() => onUnlock(row.infoId)}
                    >
                      解除锁定
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(row)}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">删除</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Card className="border border-border/70 dark:border-border/40">
      <CardContent className="p-0">{renderContent()}</CardContent>
    </Card>
  );
}
