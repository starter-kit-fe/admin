'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

import { listOperLogs } from '../api';
import {
  BASE_OPER_LOG_QUERY_KEY,
  OPER_LOG_PAGE_SIZE_OPTIONS,
} from '../constants';
import {
  useOperLogManagementSetRefreshHandler,
  useOperLogManagementSetRefreshing,
  useOperLogManagementStore,
} from '../store';
import {
  getBusinessTypeLabel,
  getOperLogStatusBadgeVariant,
  getOperLogStatusLabel,
} from '../utils';

export function OperLogDataSection() {
  const {
    appliedFilters,
    pagination,
    setPagination,
    logs,
    setLogs,
    total,
    setTotal,
    setDeleteTarget,
  } = useOperLogManagementStore();
  const setRefreshing = useOperLogManagementSetRefreshing();
  const setRefreshHandler = useOperLogManagementSetRefreshHandler();
  const queryClient = useQueryClient();

  const logQuery = useQuery({
    queryKey: [
      ...BASE_OPER_LOG_QUERY_KEY,
      appliedFilters.title,
      appliedFilters.operName,
      appliedFilters.businessType,
      appliedFilters.status,
      appliedFilters.requestMethod,
      pagination.pageNum,
      pagination.pageSize,
    ],
    queryFn: () =>
      listOperLogs({
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize,
        title: appliedFilters.title || undefined,
        operName: appliedFilters.operName || undefined,
        businessType:
          appliedFilters.businessType === 'all'
            ? undefined
            : appliedFilters.businessType,
        status:
          appliedFilters.status === 'all'
            ? undefined
            : appliedFilters.status,
        requestMethod:
          appliedFilters.requestMethod === 'all'
            ? undefined
            : appliedFilters.requestMethod,
      }),
    keepPreviousData: true,
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
        queryKey: BASE_OPER_LOG_QUERY_KEY,
      });
    });
    return () => {
      setRefreshHandler(() => {});
    };
  }, [queryClient, setRefreshHandler]);

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
            加载操作日志失败，请稍后再试。
          </div>
        ) : logs.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            暂无日志数据。
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[160px]">
                      操作标题
                    </TableHead>
                    <TableHead className="min-w-[120px]">
                      业务类型
                    </TableHead>
                    <TableHead className="min-w-[120px]">
                      执行结果
                    </TableHead>
                    <TableHead className="min-w-[120px]">
                      请求方式
                    </TableHead>
                    <TableHead className="min-w-[160px]">
                      操作人员
                    </TableHead>
                    <TableHead className="min-w-[220px]">
                      请求地址
                    </TableHead>
                    <TableHead className="min-w-[160px]">
                      操作时间
                    </TableHead>
                    <TableHead className="min-w-[120px] text-right">
                      操作
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((item) => (
                    <TableRow key={item.operId}>
                      <TableCell className="font-medium text-foreground">
                        {item.title || '-'}
                      </TableCell>
                      <TableCell>
                        {getBusinessTypeLabel(item.businessType)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getOperLogStatusBadgeVariant(
                            item.status,
                          )}
                        >
                          {getOperLogStatusLabel(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.requestMethod}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{item.operName || '-'}</span>
                          {item.operIp ? (
                            <span className="text-xs text-muted-foreground">
                              {item.operIp}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="truncate">
                            {item.operUrl || '-'}
                          </span>
                          {item.operLocation ? (
                            <span className="text-xs text-muted-foreground">
                              {item.operLocation}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{item.operTime ?? '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">删除</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PaginationToolbar
              page={pagination.pageNum}
              pageSize={pagination.pageSize}
              total={total}
              pageSizeOptions={OPER_LOG_PAGE_SIZE_OPTIONS}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
