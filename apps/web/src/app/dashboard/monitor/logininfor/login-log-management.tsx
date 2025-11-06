'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { RefreshCcw, Trash2 } from 'lucide-react';

import { PaginationToolbar } from '@/components/pagination/pagination-toolbar';
import { InlineLoading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { DeleteConfirmDialog } from '../../system/user/components/delete-confirm-dialog';

import { listLoginLogs, removeLoginLog, unlockLogin, type LoginLogListParams } from './api';
import type { LoginLog } from './type';

const STATUS_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: '0', label: '成功' },
  { value: '1', label: '失败' },
] as const;

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

interface DeleteState {
  open: boolean;
  log?: LoginLog;
}

interface UnlockState {
  id?: number;
  loading: boolean;
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function resolveStatusBadgeVariant(status: string) {
  return status === '0' ? 'secondary' : 'destructive';
}

function resolveStatusLabel(status: string) {
  return status === '0' ? '成功' : '失败';
}

export function LoginLogManagement() {
  const queryClient = useQueryClient();

  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [userNameInput, setUserNameInput] = useState('');
  const [ipInput, setIpInput] = useState('');
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]['value']>('all');

  const [deleteState, setDeleteState] = useState<DeleteState>({ open: false });
  const [unlockState, setUnlockState] = useState<UnlockState>({ loading: false });

  const debouncedUserName = useDebouncedValue(userNameInput.trim(), 250);
  const debouncedIp = useDebouncedValue(ipInput.trim(), 250);

  const queryParams: LoginLogListParams = useMemo(
    () => ({
      pageNum,
      pageSize,
      userName: debouncedUserName || undefined,
      ipaddr: debouncedIp || undefined,
      status: status === 'all' ? undefined : status,
    }),
    [pageNum, pageSize, debouncedUserName, debouncedIp, status],
  );

  const query = useQuery({
    queryKey: ['monitor', 'loginlog', queryParams],
    queryFn: () => listLoginLogs(queryParams),
    keepPreviousData: true,
  });

  const data = query.data;
  const logs = data?.items ?? [];
  const total = data?.total ?? 0;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => removeLoginLog(id),
    onSuccess: () => {
      toast.success('登录日志已删除');
      queryClient.invalidateQueries({ queryKey: ['monitor', 'loginlog'] });
      setDeleteState({ open: false });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '删除失败，请稍后重试');
    },
  });

  const unlockMutation = useMutation({
    mutationFn: (id: number) => unlockLogin(id),
    onMutate: (id) => setUnlockState({ id, loading: true }),
    onSuccess: () => {
      toast.success('账号解锁成功');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '解锁失败，请稍后重试');
    },
    onSettled: () => setUnlockState({ loading: false }),
  });

  const handlePageChange = (nextPage: number) => {
    setPageNum(nextPage);
  };

  const handlePageSizeChange = (nextSize: number) => {
    setPageSize(nextSize);
    setPageNum(1);
  };

  const isLoading = query.isLoading;
  const isRefetching = query.isRefetching;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl font-semibold text-foreground">登录日志</CardTitle>
              <CardDescription>查看用户登录记录，可按账号、IP 及状态筛选。</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => void query.refetch()}
                disabled={isLoading || isRefetching}
              >
                {isRefetching ? (
                  <>
                    <Spinner className="mr-2 size-4" />
                    刷新中
                  </>
                ) : (
                  <>
                    <RefreshCcw className="mr-2 size-4" />
                    刷新
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="loginlog-user">登录账号</Label>
              <Input
                id="loginlog-user"
                placeholder="按登录账号筛选"
                value={userNameInput}
                onChange={(event) => setUserNameInput(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="loginlog-ip">登录 IP</Label>
              <Input
                id="loginlog-ip"
                placeholder="按 IP 地址筛选"
                value={ipInput}
                onChange={(event) => setIpInput(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>登录状态</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as (typeof STATUS_OPTIONS)[number]['value'])}>
                <SelectTrigger>
                  <SelectValue placeholder="全部状态" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <InlineLoading label="加载中" />
            </div>
          ) : query.isError ? (
            <div className="py-10 text-center text-sm text-destructive">加载登录日志失败，请稍后再试。</div>
          ) : logs.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">暂无登录日志数据。</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[160px]">登录账号</TableHead>
                      <TableHead className="min-w-[160px]">登录 IP</TableHead>
                      <TableHead className="min-w-[200px]">登录地点</TableHead>
                      <TableHead className="min-w-[160px]">客户端</TableHead>
                      <TableHead className="min-w-[100px]">状态</TableHead>
                      <TableHead className="min-w-[220px]">提示信息</TableHead>
                      <TableHead className="min-w-[160px]">登录时间</TableHead>
                      <TableHead className="min-w-[140px] text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((item) => (
                      <TableRow key={item.infoId}>
                        <TableCell className="font-medium text-foreground">{item.userName || '-'}</TableCell>
                        <TableCell>{item.ipaddr || '-'}</TableCell>
                        <TableCell>{item.loginLocation || '-'}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{item.browser || '-'}</span>
                            <span className="text-xs text-muted-foreground">{item.os || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={resolveStatusBadgeVariant(item.status)}>
                            {resolveStatusLabel(item.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.msg || '-'}</TableCell>
                        <TableCell>{item.loginTime ?? '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => unlockMutation.mutate(item.infoId)}
                              disabled={unlockState.loading}
                            >
                              解除锁定
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteState({ open: true, log: item })}
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
              <PaginationToolbar
                page={pageNum}
                pageSize={pageSize}
                total={total}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteState.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteState({ open: false });
          }
        }}
        title="删除登录日志"
        description={
          deleteState.log
            ? `确定要删除账号“${deleteState.log.userName || '未命名'}”的登录日志吗？`
            : '确定要删除该登录日志吗？'
        }
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteState.log || deleteMutation.isPending) {
            return;
          }
          deleteMutation.mutate(deleteState.log.infoId);
        }}
      />
    </div>
  );
}
