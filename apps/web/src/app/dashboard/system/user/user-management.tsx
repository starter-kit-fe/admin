'use client';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Plus, RefreshCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { createUser, listUsers, removeUser, updateUser } from './api';
import { AppliedFilters } from './components/applied-filters';
import { DeleteConfirmDialog } from './components/delete-confirm-dialog';
import {
  FiltersBar,
  type FiltersFormState,
  type RoleOption,
} from './components/filters-bar';
import { SelectionBanner } from './components/selection-banner';
import { StatusTabs } from './components/status-tabs';
import { UserEditorDialog } from './components/user-editor-dialog';
import { UserTable } from './components/user-table';
import {
  DEFAULT_ROLE_VALUE,
  getRoleLabel,
  sanitizeDeptId,
  toFormValues,
} from './components/utils';
import type { User, UserFormValues } from './type';

const STATUS_TABS = [
  { value: 'all', label: '全部', color: 'bg-slate-900 text-white' },
  { value: '0', label: '启用', color: 'bg-emerald-500 text-white' },
  { value: '1', label: '停用', color: 'bg-rose-500 text-white' },
] as const;

const DEFAULT_FILTER_FORM: FiltersFormState = {
  role: DEFAULT_ROLE_VALUE,
  keyword: '',
};
const DEFAULT_PAGE = { pageNum: 1, pageSize: 10 };

export function UserManagement() {
  const queryClient = useQueryClient();
  const [status, setStatus] =
    useState<(typeof STATUS_TABS)[number]['value']>('all');
  const [filterForm, setFilterForm] =
    useState<FiltersFormState>(DEFAULT_FILTER_FORM);
  const [appliedFilters, setAppliedFilters] =
    useState<FiltersFormState>(DEFAULT_FILTER_FORM);
  const [pagination, setPagination] = useState(DEFAULT_PAGE);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [singleDelete, setSingleDelete] = useState<User | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const keywordDebounceRef = useRef<ReturnType<typeof window.setTimeout> | null>(
    null,
  );

  const queryKey = [
    'system',
    'users',
    status,
    appliedFilters.keyword,
    pagination,
  ];

  const userListQuery = useQuery({
    queryKey,
    queryFn: () =>
      listUsers({
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize,
        status: status === 'all' ? undefined : status,
        userName: appliedFilters.keyword || undefined,
      }),
  });

  const statusCountQueries = useQueries({
    queries: STATUS_TABS.map((tab) => ({
      queryKey: ['system', 'users', 'count', tab.value, appliedFilters.keyword],
      queryFn: () =>
        listUsers({
          pageNum: 1,
          pageSize: 1,
          status: tab.value === 'all' ? undefined : tab.value,
          userName: appliedFilters.keyword || undefined,
        }),
      select: (data) => data.total,
    })),
  });

  const statusCounts = useMemo(() => {
    const result: Record<string, number> = {};
    STATUS_TABS.forEach((tab, index) => {
      result[tab.value] = statusCountQueries[index]?.data ?? 0;
    });
    return result;
  }, [statusCountQueries]);

  const rows = useMemo(
    () => userListQuery.data?.items ?? [],
    [userListQuery.data?.items],
  );

  const roleOptions: RoleOption[] = useMemo(() => {
    const roleSet = new Set<string>();
    rows.forEach((user) => {
      const role = getRoleLabel(user);
      if (role) {
        roleSet.add(role);
      }
    });
    return [
      { label: '全部角色', value: DEFAULT_ROLE_VALUE },
      ...Array.from(roleSet).map((role) => ({ label: role, value: role })),
    ];
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (appliedFilters.role === DEFAULT_ROLE_VALUE) {
      return rows;
    }
    return rows.filter((user) => getRoleLabel(user) === appliedFilters.role);
  }, [rows, appliedFilters.role]);

  useEffect(() => {
    setSelectedIds((prev) => {
      if (filteredRows.length === 0) {
        return new Set();
      }
      const next = new Set<number>();
      filteredRows.forEach((user) => {
        if (prev.has(user.userId)) {
          next.add(user.userId);
        }
      });
      return next;
    });
  }, [filteredRows]);

  const createMutation = useMutation({
    mutationFn: (values: UserFormValues) =>
      createUser({
        userName: values.userName.trim(),
        nickName: values.nickName.trim(),
        deptId: sanitizeDeptId(values.deptId),
        email: values.email.trim(),
        phonenumber: values.phonenumber.trim(),
        sex: values.sex,
        status: values.status,
        password: values.password?.trim() ?? '',
        remark: values.remark.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('用户创建成功');
      setEditorOpen(false);
      setEditingUser(null);
      refetchUsers();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : '创建用户失败，请稍后重试';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: UserFormValues }) =>
      updateUser(id, {
        userName: values.userName.trim(),
        nickName: values.nickName.trim(),
        deptId: sanitizeDeptId(values.deptId),
        email: values.email.trim(),
        phonenumber: values.phonenumber.trim(),
        sex: values.sex,
        status: values.status,
        remark: values.remark.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('用户信息已更新');
      setEditorOpen(false);
      setEditingUser(null);
      refetchUsers();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : '更新用户失败，请稍后再试';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: number) => removeUser(userId),
    onSuccess: () => {
      toast.success('用户已删除');
      setSingleDelete(null);
      refetchUsers();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : '删除用户失败，请稍后再试';
      toast.error(message);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => removeUser(id)));
    },
    onSuccess: () => {
      toast.success('批量删除成功');
      setBulkDeleteOpen(false);
      setSelectedIds(new Set());
      refetchUsers();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : '批量删除失败，请稍后再试';
      toast.error(message);
    },
  });

  const selectedCount = selectedIds.size;
  const isAllSelected =
    filteredRows.length > 0 &&
    filteredRows.every((row) => selectedIds.has(row.userId));
  const headerCheckboxState = isAllSelected
    ? true
    : selectedCount > 0
      ? ('indeterminate' as const)
      : false;

  const statusTabsWithCount = STATUS_TABS.map((tab) => ({
    value: tab.value,
    label: tab.label,
    count: statusCounts[tab.value] ?? 0,
    activeColor: tab.color,
  }));

  const appliedFilterChips = [
    appliedFilters.role !== DEFAULT_ROLE_VALUE
      ? { key: 'role', label: '角色', value: appliedFilters.role }
      : null,
    appliedFilters.keyword
      ? { key: 'keyword', label: '关键字', value: appliedFilters.keyword }
      : null,
  ].filter(
    (item): item is { key: string; label: string; value: string } =>
      item !== null,
  );

  const clearKeywordDebounce = useCallback(() => {
    if (keywordDebounceRef.current) {
      window.clearTimeout(keywordDebounceRef.current);
      keywordDebounceRef.current = null;
    }
  }, []);

  const applyFilters = useCallback(
    (nextFilters: FiltersFormState, options?: { force?: boolean }) => {
      const forceUpdate = options?.force ?? false;
      setAppliedFilters((prev) => {
        const hasChanged =
          forceUpdate ||
          prev.role !== nextFilters.role ||
          prev.keyword !== nextFilters.keyword;

        if (!hasChanged) {
          return prev;
        }

        setPagination(DEFAULT_PAGE);
        setSelectedIds(new Set());
        return nextFilters;
      });
    },
    [setPagination, setSelectedIds],
  );

  const handleRoleFilterChange = (role: string) => {
    clearKeywordDebounce();
    setFilterForm((prev) => {
      const next = { ...prev, role };
      applyFilters(next);
      return next;
    });
  };

  const handleKeywordChange = (keyword: string) => {
    setFilterForm((prev) => {
      const next = { ...prev, keyword };
      clearKeywordDebounce();
      keywordDebounceRef.current = window.setTimeout(() => {
        applyFilters(next);
      }, 400);
      return next;
    });
  };

  useEffect(() => {
    return () => {
      clearKeywordDebounce();
    };
  }, [clearKeywordDebounce]);

  const handleResetFilters = () => {
    clearKeywordDebounce();
    setFilterForm(DEFAULT_FILTER_FORM);
    applyFilters(DEFAULT_FILTER_FORM, { force: true });
  };

  const handleStatusChange = (nextStatus: string) => {
    setStatus(nextStatus as (typeof STATUS_TABS)[number]['value']);
    setPagination(DEFAULT_PAGE);
    setSelectedIds(new Set());
  };

  const refetchUsers = () => {
    void queryClient.invalidateQueries({ queryKey: ['system', 'users'] });
  };

  const openCreateDialog = () => {
    setEditorMode('create');
    setEditingUser(null);
    setEditorOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditorMode('edit');
    setEditingUser(user);
    setEditorOpen(true);
  };

  const handleChangeRole = (user: User) => {
    openEditDialog(user);
  };

  const handleResetPassword = (user: User) => {
    toast.info('重置密码功能暂未开放，敬请期待。');
  };

  const triggerDelete = (user: User) => {
    setSingleDelete(user);
  };

  const onBulkDelete = () => {
    if (selectedCount === 0) return;
    setBulkDeleteOpen(true);
  };

  const editorDefaultValues: UserFormValues | undefined =
    editorMode === 'edit' && editingUser
      ? toFormValues(editingUser)
      : undefined;

  const handleEditorSubmit = (values: UserFormValues) => {
    if (editorMode === 'create') {
      createMutation.mutate(values);
    } else if (editingUser) {
      updateMutation.mutate({ id: editingUser.userId, values });
    }
  };

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredRows.map((row) => row.userId)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelectRow = (userId: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  };

  const handleRemoveFilter = (key: string) => {
    clearKeywordDebounce();
    if (key === 'role') {
      const next = { ...appliedFilters, role: DEFAULT_ROLE_VALUE };
      setFilterForm(next);
      applyFilters(next, { force: true });
    } else if (key === 'keyword') {
      const next = { ...appliedFilters, keyword: '' };
      setFilterForm(next);
      applyFilters(next, { force: true });
    }
  };

  const handlePagination = (pageNum: number) => {
    setPagination((prev) => ({ ...prev, pageNum }));
    setSelectedIds(new Set());
  };

  const total = userListQuery.data?.total ?? 0;
  const totalPages =
    pagination.pageSize > 0
      ? Math.max(1, Math.ceil(total / pagination.pageSize))
      : 1;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">用户管理</h1>
          <p className="text-sm text-muted-foreground">
            通过状态筛选、批量操作和响应式弹窗管理系统用户。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetchUsers()}
            disabled={
              userListQuery.isFetching ||
              createMutation.isPending ||
              updateMutation.isPending
            }
          >
            {userListQuery.isFetching ? (
              <Spinner className="mr-2 size-4" />
            ) : (
              <RefreshCcw className="mr-2 size-4" />
            )}
            刷新
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 size-4" />
            新增用户
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4">
          <StatusTabs
            value={status}
            onValueChange={handleStatusChange}
            tabs={statusTabsWithCount}
          />

          <FiltersBar
            value={filterForm}
            onRoleChange={handleRoleFilterChange}
            onKeywordChange={handleKeywordChange}
            roleOptions={roleOptions}
          />

          <AppliedFilters
            items={appliedFilterChips}
            onRemove={handleRemoveFilter}
            onClear={handleResetFilters}
          />
        </div>
      </div>

      <SelectionBanner
        count={selectedCount}
        onClear={() => setSelectedIds(new Set())}
        onBulkDelete={onBulkDelete}
      />

      <UserTable
        rows={filteredRows}
        headerCheckboxState={headerCheckboxState}
        onToggleSelectAll={handleToggleSelectAll}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelectRow}
        onEdit={openEditDialog}
        onResetPassword={handleResetPassword}
        onChangeRole={handleChangeRole}
        onDelete={triggerDelete}
        isLoading={userListQuery.isLoading}
        isError={userListQuery.isError}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          共 {total} 条记录，当前第 {pagination.pageNum} / {totalPages} 页
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handlePagination(Math.max(1, pagination.pageNum - 1))
            }
            disabled={pagination.pageNum <= 1 || userListQuery.isFetching}
          >
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handlePagination(Math.min(totalPages, pagination.pageNum + 1))
            }
            disabled={
              pagination.pageNum >= totalPages || userListQuery.isFetching
            }
          >
            下一页
          </Button>
          <div className="text-xs text-muted-foreground">
            每页 {pagination.pageSize} 条（暂不支持修改）
          </div>
        </div>
      </div>

      <UserEditorDialog
        mode={editorMode}
        open={editorOpen}
        defaultValues={editorDefaultValues}
        submitting={createMutation.isPending || updateMutation.isPending}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) {
            setEditingUser(null);
          }
        }}
        onSubmit={handleEditorSubmit}
      />

      <DeleteConfirmDialog
        open={singleDelete !== null}
        onOpenChange={(open) => {
          if (!open) setSingleDelete(null);
        }}
        title="删除用户"
        description={
          singleDelete
            ? `确定要删除用户「${singleDelete.nickName || singleDelete.userName}」吗？该操作无法撤销。`
            : '确认删除所选用户吗？'
        }
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (singleDelete) {
            deleteMutation.mutate(singleDelete.userId);
          }
        }}
      />

      <DeleteConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="批量删除用户"
        description={`将删除选中的 ${selectedCount} 个用户，操作不可恢复。`}
        confirmLabel="批量删除"
        loading={bulkDeleteMutation.isPending}
        onConfirm={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
      />
    </div>
  );
}
