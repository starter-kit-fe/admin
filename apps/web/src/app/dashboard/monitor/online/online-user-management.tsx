'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type RowSelectionState,
} from '@tanstack/react-table';
import { toast } from 'sonner';
import { Ban, LogOut, RefreshCcw } from 'lucide-react';

import { InlineLoading } from '@/components/loading';
import { PaginationToolbar } from '@/components/pagination/pagination-toolbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { DeleteConfirmDialog } from '../../system/user/components/delete-confirm-dialog';

import {
  batchForceLogoutOnlineUsers,
  forceLogoutOnlineUser,
  listOnlineUsers,
  type OnlineUserListParams,
} from './api';
import { isOnlineUserListResponse, type OnlineUser } from './type';

const TIME_RANGE_OPTIONS = [
  { value: 'all', label: '不限时间', minutes: undefined },
  { value: '1h', label: '最近 1 小时', minutes: 60 },
  { value: '6h', label: '最近 6 小时', minutes: 6 * 60 },
  { value: '24h', label: '最近 24 小时', minutes: 24 * 60 },
  { value: '7d', label: '最近 7 天', minutes: 7 * 24 * 60 },
] as const;

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

type TimeRangeValue = (typeof TIME_RANGE_OPTIONS)[number]['value'];

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function resolveSinceValue(timeRange: TimeRangeValue) {
  const option = TIME_RANGE_OPTIONS.find((item) => item.value === timeRange);
  if (!option || !option.minutes) {
    return undefined;
  }
  const now = Date.now();
  const millis = option.minutes * 60 * 1000;
  return new Date(now - millis).toISOString();
}

function resolveOnlineUserIdentifier(user: OnlineUser): string | null {
  if (typeof user.infoId === 'number' && Number.isFinite(user.infoId)) {
    return String(user.infoId);
  }

  const candidates = [user.tokenId, user.sessionId, user.uuid];
  const found = candidates.find(
    (value): value is string => typeof value === 'string' && value.trim().length > 0,
  );

  if (found) {
    return found;
  }

  return null;
}

function getOnlineUserRowId(user: OnlineUser) {
  const identifier = resolveOnlineUserIdentifier(user);
  if (identifier) {
    return identifier;
  }
  const fallback = [
    user.userName || 'unknown',
    user.ipaddr || 'ip',
    user.loginTime || user.lastAccessTime || 'time',
  ];
  return fallback.join('|');
}

function extractOnlineUserIdentifiers(users: OnlineUser[]) {
  const ids: string[] = [];
  let skipped = 0;
  users.forEach((user) => {
    const identifier = resolveOnlineUserIdentifier(user);
    if (identifier) {
      ids.push(identifier);
    } else {
      skipped += 1;
    }
  });
  return { ids, skipped };
}

function resolveStatusBadgeVariant(status?: string | null) {
  return status === '0' ? 'secondary' : 'outline';
}

export function OnlineUserManagement() {
  const queryClient = useQueryClient();

  const [userNameInput, setUserNameInput] = useState('');
  const [ipInput, setIpInput] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRangeValue>('all');
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pendingForceRowId, setPendingForceRowId] = useState<string | null>(null);
  const [forceDialogState, setForceDialogState] = useState<{
    open: boolean;
    user?: OnlineUser;
  }>({ open: false });
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);

  const debouncedUserName = useDebouncedValue(userNameInput.trim(), 250);
  const debouncedIp = useDebouncedValue(ipInput.trim(), 250);

  const queryParams: OnlineUserListParams = useMemo(() => {
    const params: OnlineUserListParams = {
      pageNum,
      pageSize,
    };

    if (debouncedUserName) {
      params.userName = debouncedUserName;
    }
    if (debouncedIp) {
      params.ipaddr = debouncedIp;
    }
    const since = resolveSinceValue(timeRange);
    if (since) {
      params.since = since;
    }

    return params;
  }, [pageNum, pageSize, debouncedUserName, debouncedIp, timeRange]);

  const query = useQuery({
    queryKey: ['monitor', 'online-users', queryParams],
    queryFn: () => listOnlineUsers(queryParams),
    keepPreviousData: true,
  });

  const rawData = query.data;

  useEffect(() => {
    setPageNum(1);
    setRowSelection({});
  }, [debouncedUserName, debouncedIp, timeRange]);

  const { tableRows, total } = useMemo(() => {
    if (!rawData) {
      return { tableRows: [] as OnlineUser[], total: 0 };
    }

    if (isOnlineUserListResponse(rawData)) {
      const rows = rawData.items ?? [];
      const total = typeof rawData.total === 'number' ? rawData.total : rows.length;
      return { tableRows: rows, total };
    }

    if (Array.isArray(rawData)) {
      const total = rawData.length;
      const start = (pageNum - 1) * pageSize;
      const end = start + pageSize;
      return { tableRows: rawData.slice(start, end), total };
    }

    return { tableRows: [] as OnlineUser[], total: 0 };
  }, [rawData, pageNum, pageSize]);

  const columnHelper = useMemo(() => createColumnHelper<OnlineUser>(), []);

  const forceLogoutMutation = useMutation({
    mutationFn: async (user: OnlineUser) => {
      const identifier = resolveOnlineUserIdentifier(user);
      if (!identifier) {
        throw new Error('未找到用户会话标识，无法强制下线');
      }
      await forceLogoutOnlineUser(identifier);
      return identifier;
    },
    onMutate: (user) => {
      setPendingForceRowId(getOnlineUserRowId(user));
    },
    onSuccess: () => {
      toast.success('已强制下线该用户');
      void queryClient.invalidateQueries({ queryKey: ['monitor', 'online-users'] });
      setForceDialogState({ open: false, user: undefined });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '操作失败，请稍后重试';
      toast.error(message);
    },
    onSettled: () => {
      setPendingForceRowId(null);
    },
  });

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => {
          const checkedState = table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? 'indeterminate'
              : false;
          return (
            <Checkbox
              aria-label="选择全部"
              checked={checkedState}
              onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked === true)}
            />
          );
        },
        cell: ({ row }) => (
          <Checkbox
            aria-label={`选择 ${row.original.userName || '用户'}`}
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onCheckedChange={(checked) => row.toggleSelected(checked === true)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        meta: {
          headerClassName: 'w-12',
          cellClassName: 'w-12 align-middle',
        },
      }),
      columnHelper.accessor('userName', {
        header: () => '登录账号',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{user.userName || '-'}</p>
              <p className="text-xs text-muted-foreground">
                {user.nickName?.trim() || user.deptName?.trim() || '—'}
              </p>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[180px]',
        },
      }),
      columnHelper.display({
        id: 'ipaddr',
        header: () => 'IP / 地点',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="space-y-1">
              <p className="text-sm text-foreground">{user.ipaddr || '-'}</p>
              <p className="text-xs text-muted-foreground">{user.loginLocation || '未知地点'}</p>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[180px]',
        },
      }),
      columnHelper.display({
        id: 'client',
        header: () => '客户端',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="space-y-1">
              <p className="text-sm text-foreground">{user.browser || '-'}</p>
              <p className="text-xs text-muted-foreground">{user.os || '-'}</p>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[160px]',
        },
      }),
      columnHelper.display({
        id: 'status',
        header: () => '状态',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <Badge variant={resolveStatusBadgeVariant(user.status)}>
              {user.status === '0' || !user.status ? '在线' : '异常'}
            </Badge>
          );
        },
        meta: {
          headerClassName: 'w-[100px]',
          cellClassName: 'align-middle',
        },
      }),
      columnHelper.display({
        id: 'loginTime',
        header: () => '登录时间',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="space-y-1">
              <p className="text-sm text-foreground">{user.loginTime || '-'}</p>
              {user.lastAccessTime ? (
                <p className="text-xs text-muted-foreground">最近活跃：{user.lastAccessTime}</p>
              ) : null}
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[180px]',
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="block text-right">操作</span>,
        cell: ({ row }) => {
          const user = row.original;
          const rowId = row.id;
          const isMutating = forceLogoutMutation.isPending && pendingForceRowId === rowId;

          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-sm font-medium"
                onClick={(event) => {
                  event.stopPropagation();
                  setForceDialogState({ open: true, user });
                }}
                disabled={isMutating}
              >
                {isMutating ? (
                  <>
                    <Spinner className="mr-1.5 size-4" />
                    处理中
                  </>
                ) : (
                  <>
                    <LogOut className="mr-1.5 size-3.5" />
                    强退
                  </>
                )}
              </Button>
            </div>
          );
        },
        enableSorting: false,
        meta: {
          headerClassName: 'w-[120px] text-right',
          cellClassName: 'text-right',
        },
      }),
    ],
    [columnHelper, forceLogoutMutation.isPending, pendingForceRowId],
  );

  const table = useReactTable({
    data: tableRows,
    columns,
    state: {
      rowSelection,
    },
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    getRowId: (row) => getOnlineUserRowId(row),
    onRowSelectionChange: setRowSelection,
  });

  const selectedUsers = table.getSelectedRowModel().rows.map((row) => row.original);
  const selectedCount = selectedUsers.length;

  const batchForceLogoutMutation = useMutation({
    mutationFn: async (users: OnlineUser[]) => {
      const { ids, skipped } = extractOnlineUserIdentifiers(users);
      if (ids.length === 0) {
        throw new Error('未找到可用的会话，无法执行批量强退');
      }
      await batchForceLogoutOnlineUsers(ids);
      return { count: ids.length, skipped };
    },
    onSuccess: (result) => {
      toast.success(`已强制下线 ${result.count} 名用户`);
      if (result.skipped > 0) {
        toast.warning(`另有 ${result.skipped} 名用户缺少会话标识，未能处理`);
      }
      void queryClient.invalidateQueries({ queryKey: ['monitor', 'online-users'] });
      setRowSelection({});
      setBatchDialogOpen(false);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '批量强退失败，请稍后重试';
      toast.error(message);
    },
  });

  const handlePageChange = (nextPage: number) => {
    setPageNum(nextPage);
    setRowSelection({});
  };

  const handlePageSizeChange = (nextSize: number) => {
    setPageSize(nextSize);
    setPageNum(1);
    setRowSelection({});
  };

  const isLoading = query.isLoading && tableRows.length === 0;
  const isRefetching = query.isRefetching;
  const isError = query.isError;

  const visibleColumnCount = table.getVisibleLeafColumns().length || columns.length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl font-semibold text-foreground">在线用户</CardTitle>
              <CardDescription>实时查看活跃会话，支持按账号、IP 与活跃时间筛选。</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="destructive"
                onClick={() => setBatchDialogOpen(true)}
                disabled={selectedCount === 0 || batchForceLogoutMutation.isPending}
              >
                {batchForceLogoutMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 size-4" />
                    强退中
                  </>
                ) : (
                  <>
                    <Ban className="mr-2 size-4" />
                    批量强退
                  </>
                )}
              </Button>
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
              <Label htmlFor="online-user-name">登录账号</Label>
              <Input
                id="online-user-name"
                placeholder="按登录账号筛选"
                value={userNameInput}
                onChange={(event) => setUserNameInput(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="online-ip">登录 IP</Label>
              <Input
                id="online-ip"
                placeholder="按 IP 地址筛选"
                value={ipInput}
                onChange={(event) => setIpInput(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="online-time-range">活跃时间</Label>
              <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRangeValue)}>
                <SelectTrigger id="online-time-range">
                  <SelectValue placeholder="全部时间" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {selectedCount > 0 ? (
            <div className="text-sm text-muted-foreground">
              已选择 {selectedCount} 名用户。
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/40">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={cn(header.column.columnDef.meta?.headerClassName as string | undefined)}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumnCount} className="h-32 border-t text-center align-middle">
                      <InlineLoading label="正在加载在线用户..." />
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell
                      colSpan={visibleColumnCount}
                      className="h-24 border-t text-center text-sm text-destructive"
                    >
                      加载失败，请稍后重试。
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={visibleColumnCount}
                      className="h-24 border-t text-center text-sm text-muted-foreground"
                    >
                      暂无在线用户。
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => {
                    const isSelected = row.getIsSelected();
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
                            className={cn(cell.column.columnDef.meta?.cellClassName as string | undefined)}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {!isLoading && !isError && total > 0 ? (
            <PaginationToolbar
              totalItems={total}
              currentPage={pageNum}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          ) : null}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={forceDialogState.open}
        onOpenChange={(open) => {
          if (!open) {
            setForceDialogState({ open: false, user: undefined });
          }
        }}
        title="强制下线"
        description={
          forceDialogState.user
            ? `确定要强制下线账号“${forceDialogState.user.userName || '未命名'}”吗？`
            : '确定要强制下线该用户吗？'
        }
        confirmLabel="确认强退"
        loading={forceLogoutMutation.isPending}
        onConfirm={() => {
          if (!forceDialogState.user || forceLogoutMutation.isPending) {
            return;
          }
          forceLogoutMutation.mutate(forceDialogState.user);
        }}
      />

      <DeleteConfirmDialog
        open={batchDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setBatchDialogOpen(false);
          }
        }}
        title="批量强退"
        description={
          selectedCount > 0
            ? `确定要强制下线已选的 ${selectedCount} 名用户吗？`
            : '请选择至少一名用户后再尝试批量强退。'
        }
        confirmLabel="批量强退"
        loading={batchForceLogoutMutation.isPending}
        onConfirm={() => {
          if (batchForceLogoutMutation.isPending || selectedCount === 0) {
            return;
          }
          batchForceLogoutMutation.mutate(selectedUsers);
        }}
      />
    </div>
  );
}

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
  }
}
