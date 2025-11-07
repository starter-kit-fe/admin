'use client';

import { useEffect } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

import { PaginationToolbar } from '@/components/pagination/pagination-toolbar';
import { InlineLoading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  BASE_LOGIN_LOG_QUERY_KEY,
  LOGIN_LOG_PAGE_SIZE_OPTIONS,
} from '../constants';
import { listLoginLogs, unlockLogin } from '../api';
import {
  useLoginLogManagementMutationCounter,
  useLoginLogManagementSetRefreshHandler,
  useLoginLogManagementSetRefreshing,
  useLoginLogManagementStore,
} from '../store';
import {
  getLoginStatusBadgeVariant,
  getLoginStatusLabel,
  resolveErrorMessage,
} from '../utils';

export function LoginLogDataSection() {
  const {
    status,
    appliedFilters,
    pagination,
    setPagination,
    logs,
    setLogs,
    total,
    setTotal,
    setDeleteTarget,
  } = useLoginLogManagementStore();
  const setRefreshing = useLoginLogManagementSetRefreshing();
  const setRefreshHandler = useLoginLogManagementSetRefreshHandler();
  const { beginMutation, endMutation } =
    useLoginLogManagementMutationCounter();
  const queryClient = useQueryClient();

  const logQuery = useQuery({
    queryKey: [
      ...BASE_LOGIN_LOG_QUERY_KEY,
      status,
      pagination.pageNum,
      pagination.pageSize,
      appliedFilters.userName,
      appliedFilters.ipaddr,
    ],
    queryFn: () =>
      listLoginLogs({
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize,
        status: status === 'all' ? undefined : status,
        userName: appliedFilters.userName || undefined,
        ipaddr: appliedFilters.ipaddr || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (logQuery.data) {
      setLogs(logQuery.data.items);
      setTotal(logQuery.data.total);
    }
  }, [logQuery.data, setLogs, setTotal]);

  useEffect(() => {
    setRefreshing(logQuery.isFetching);
  }, [logQuery.isFetching, setRefreshing]);

  useEffect(() => {
    setRefreshHandler(() => {
      void queryClient.invalidateQueries({
        queryKey: BASE_LOGIN_LOG_QUERY_KEY,
      });
    });
    return () => {
      setRefreshHandler(() => {});
    };
  }, [queryClient, setRefreshHandler]);

  const unlockMutation = useMutation({
    mutationFn: (id: number) => unlockLogin(id),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('账号解锁成功');
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '解锁失败，请稍后重试'));
    },
    onSettled: () => {
      endMutation();
    },
  });

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, pageNum: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination((prev) => ({ ...prev, pageNum: 1, pageSize: size }));
  };

  const loading = logQuery.isLoading && logs.length === 0;
  const error = logQuery.isError && logs.length === 0;

  return (
    <Card className="border border-border/70 shadow-sm dark:border-border/40">
      <CardContent className="p-0">
        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <InlineLoading label="加载中" />
          </div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-destructive">
            加载登录日志失败，请稍后再试。
          </div>
        ) : logs.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            暂无登录日志数据。
          </div>
        ) : (
          <>
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
                    <TableHead className="min-w-[160px] text-right">
                      操作
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((item) => (
                    <TableRow key={item.infoId}>
                      <TableCell className="font-medium text-foreground">
                        {item.userName || '-'}
                      </TableCell>
                      <TableCell>{item.ipaddr || '-'}</TableCell>
                      <TableCell>{item.loginLocation || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{item.browser || '-'}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.os || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getLoginStatusBadgeVariant(item.status)}
                        >
                          {getLoginStatusLabel(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.msg || '-'}</TableCell>
                      <TableCell>{item.loginTime ?? '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={unlockMutation.isPending}
                            onClick={() => unlockMutation.mutate(item.infoId)}
                          >
                            解除锁定
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(item)}
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
              currentPage={pagination.pageNum}
              pageSize={pagination.pageSize}
              totalItems={total}
              pageSizeOptions={LOGIN_LOG_PAGE_SIZE_OPTIONS}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
