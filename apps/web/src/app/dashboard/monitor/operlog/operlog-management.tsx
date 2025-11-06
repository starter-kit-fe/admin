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

import { listOperLogs, removeOperLog, type OperLogListParams } from './api';
import type { OperLog } from './type';

const STATUS_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: '0', label: '成功' },
  { value: '1', label: '失败' },
] as const;

const BUSINESS_TYPE_OPTIONS = [
  { value: 'all', label: '全部业务' },
  { value: '0', label: '其它' },
  { value: '1', label: '新增' },
  { value: '2', label: '修改' },
  { value: '3', label: '删除' },
  { value: '4', label: '授权' },
  { value: '5', label: '导出' },
  { value: '6', label: '导入' },
] as const;

const REQUEST_METHOD_OPTIONS = [
  { value: 'all', label: '全部请求' },
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
] as const;

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

interface DeleteState {
  open: boolean;
  log?: OperLog;
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function resolveStatusBadgeVariant(status: number) {
  return status === 0 ? 'secondary' : 'destructive';
}

function resolveStatusLabel(status: number) {
  return status === 0 ? '成功' : '失败';
}

export function OperLogManagement() {
  const queryClient = useQueryClient();

  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [titleInput, setTitleInput] = useState('');
  const [operNameInput, setOperNameInput] = useState('');
  const [businessType, setBusinessType] = useState<(typeof BUSINESS_TYPE_OPTIONS)[number]['value']>('all');
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]['value']>('all');
  const [requestMethod, setRequestMethod] = useState<(typeof REQUEST_METHOD_OPTIONS)[number]['value']>('all');

  const [deleteState, setDeleteState] = useState<DeleteState>({ open: false });

  const debouncedTitle = useDebouncedValue(titleInput.trim(), 250);
  const debouncedOperName = useDebouncedValue(operNameInput.trim(), 250);

  const queryParams: OperLogListParams = useMemo(
    () => ({
      pageNum,
      pageSize,
      title: debouncedTitle || undefined,
      operName: debouncedOperName || undefined,
      businessType: businessType === 'all' ? undefined : businessType,
      status: status === 'all' ? undefined : status,
      requestMethod: requestMethod === 'all' ? undefined : requestMethod,
    }),
    [pageNum, pageSize, debouncedTitle, debouncedOperName, businessType, status, requestMethod],
  );

  const query = useQuery({
    queryKey: ['monitor', 'operlog', queryParams],
    queryFn: () => listOperLogs(queryParams),
    keepPreviousData: true,
  });

  const data = query.data;
  const logs = data?.items ?? [];
  const total = data?.total ?? 0;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => removeOperLog(id),
    onSuccess: () => {
      toast.success('操作日志已删除');
      queryClient.invalidateQueries({ queryKey: ['monitor', 'operlog'] });
      setDeleteState({ open: false });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '删除失败，请稍后再试');
    },
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
              <CardTitle className="text-2xl font-semibold text-foreground">操作日志</CardTitle>
              <CardDescription>查看系统操作记录，可按业务类型、状态及请求信息筛选。</CardDescription>
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
              <Label htmlFor="operlog-title">标题</Label>
              <Input
                id="operlog-title"
                placeholder="按标题筛选"
                value={titleInput}
                onChange={(event) => setTitleInput(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="operlog-operName">操作人员</Label>
              <Input
                id="operlog-operName"
                placeholder="按操作人员筛选"
                value={operNameInput}
                onChange={(event) => setOperNameInput(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>业务类型</Label>
              <Select value={businessType} onValueChange={(value) => setBusinessType(value as (typeof BUSINESS_TYPE_OPTIONS)[number]['value'])}>
                <SelectTrigger>
                  <SelectValue placeholder="全部业务" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>执行结果</Label>
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
            <div className="flex flex-col gap-2">
              <Label>请求方式</Label>
              <Select
                value={requestMethod}
                onValueChange={(value) => setRequestMethod(value as (typeof REQUEST_METHOD_OPTIONS)[number]['value'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部请求" />
                </SelectTrigger>
                <SelectContent>
                  {REQUEST_METHOD_OPTIONS.map((option) => (
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
            <div className="py-10 text-center text-sm text-destructive">加载操作日志失败，请稍后再试。</div>
          ) : logs.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">暂无日志数据。</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[160px]">操作标题</TableHead>
                      <TableHead className="min-w-[120px]">业务类型</TableHead>
                      <TableHead className="min-w-[100px]">执行结果</TableHead>
                      <TableHead className="min-w-[120px]">请求方式</TableHead>
                      <TableHead className="min-w-[160px]">操作人员</TableHead>
                      <TableHead className="min-w-[220px]">请求地址</TableHead>
                      <TableHead className="min-w-[160px]">操作时间</TableHead>
                      <TableHead className="min-w-[120px] text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((item) => (
                      <TableRow key={item.operId}>
                        <TableCell className="font-medium text-foreground">{item.title || '-'}</TableCell>
                        <TableCell>{item.businessType}</TableCell>
                        <TableCell>
                          <Badge variant={resolveStatusBadgeVariant(item.status)}>
                            {resolveStatusLabel(item.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.requestMethod}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{item.operName || '-'}</span>
                            {item.operIp ? <span className="text-xs text-muted-foreground">{item.operIp}</span> : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="truncate">{item.operUrl || '-'}</span>
                            {item.operLocation ? (
                              <span className="text-xs text-muted-foreground">{item.operLocation}</span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>{item.operTime ?? '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteState({ open: true, log: item })}
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
        title="删除操作日志"
        description={
          deleteState.log
            ? `确定要删除操作“${deleteState.log.title || '未命名'}”的日志记录吗？`
            : '确定要删除该操作日志吗？'
        }
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteState.log || deleteMutation.isPending) {
            return;
          }
          deleteMutation.mutate(deleteState.log.operId);
        }}
      />
    </div>
  );
}
