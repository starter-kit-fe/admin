'use client';

import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { PaginationToolbar } from '@/components/pagination/pagination-toolbar';

import { createUser, listUsers, removeUser, updateUser } from './api';
import { DeleteConfirmDialog } from './components/delete-confirm-dialog';
import type { FiltersFormState, RoleOption } from './components/filters-bar';
import { SelectionBanner } from './components/selection-banner';
import { UserEditorDialog } from './components/user-editor-dialog';
import { UserManagementFilters } from './components/user-management-filters';
import type { FilterChip } from './components/user-management-filters';
import { UserManagementHeader } from './components/user-management-header';
import { UserTable } from './components/user-table';
import {
  DEFAULT_ROLE_VALUE,
  getRoleLabel,
  sanitizeDeptId,
  sanitizeRoleId,
  toFormValues,
} from './components/utils';
import type { User, UserFormValues, UserListResponse } from './type';

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
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

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
  const keywordDebounceRef = useRef<number | null>(null);
  const submitLockRef = useRef(false);

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
      select: (data: UserListResponse) => data.total,
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
    mutationFn: (values: UserFormValues) => {
      const deptId = sanitizeDeptId(values.deptId);
      const roleId = sanitizeRoleId(values.roleId);
      const remark = values.remark.trim();
      return createUser({
        userName: values.userName.trim(),
        nickName: values.nickName.trim(),
        deptId,
        email: values.email.trim(),
        phonenumber: values.phonenumber.trim(),
        sex: values.sex,
        status: values.status,
        password: values.password?.trim() ?? '',
        remark: remark === '' ? undefined : remark,
        roleIds: roleId !== undefined ? [roleId] : undefined,
      });
    },
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
    mutationFn: ({ id, values }: { id: number; values: UserFormValues }) => {
      const deptId = sanitizeDeptId(values.deptId);
      const roleId = sanitizeRoleId(values.roleId);
      const remark = values.remark.trim();

      return updateUser(id, {
        userName: values.userName.trim(),
        nickName: values.nickName.trim(),
        deptId,
        email: values.email.trim(),
        phonenumber: values.phonenumber.trim(),
        sex: values.sex,
        status: values.status,
        remark: remark === '' ? undefined : remark,
        roleIds: roleId !== undefined ? [roleId] : undefined,
      });
    },
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

  const appliedFilterChips: FilterChip[] = [];
  if (appliedFilters.role !== DEFAULT_ROLE_VALUE) {
    appliedFilterChips.push({
      key: 'role',
      label: '角色',
      value: appliedFilters.role,
    });
  }
  if (appliedFilters.keyword) {
    appliedFilterChips.push({
      key: 'keyword',
      label: '关键字',
      value: appliedFilters.keyword,
    });
  }

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
    void user;
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
    if (
      createMutation.isPending ||
      updateMutation.isPending ||
      submitLockRef.current
    ) {
      return;
    }

    const releaseSubmitLock = () => {
      submitLockRef.current = false;
    };

    if (editorMode === 'create') {
      submitLockRef.current = true;
      createMutation.mutate(values, {
        onSettled: releaseSubmitLock,
      });
    } else if (editingUser) {
      submitLockRef.current = true;
      updateMutation.mutate(
        { id: editingUser.userId, values },
        {
          onSettled: releaseSubmitLock,
        },
      );
    } else {
      releaseSubmitLock();
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

  const handlePageChange = (pageNum: number) => {
    setPagination((prev) => ({ ...prev, pageNum }));
    setSelectedIds(new Set());
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination({ pageNum: 1, pageSize });
    setSelectedIds(new Set());
  };

  const total = userListQuery.data?.total ?? 0;

  const isMutating = createMutation.isPending || updateMutation.isPending;
  const isRefreshing = userListQuery.isFetching;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
      <UserManagementHeader
        onRefresh={() => refetchUsers()}
        onCreate={openCreateDialog}
        disableActions={isMutating}
        isRefreshing={isRefreshing}
      />

      <UserManagementFilters
        status={status}
        statusTabs={statusTabsWithCount}
        onStatusChange={handleStatusChange}
        filterForm={filterForm}
        onRoleChange={handleRoleFilterChange}
        onKeywordChange={handleKeywordChange}
        roleOptions={roleOptions}
        appliedFilters={appliedFilterChips}
        onRemoveFilter={handleRemoveFilter}
        onResetFilters={handleResetFilters}
      />

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

      <PaginationToolbar
        totalItems={total}
        currentPage={pagination.pageNum}
        pageSize={pagination.pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        disabled={isRefreshing}
      />

      <UserEditorDialog
        mode={editorMode}
        open={editorOpen}
        defaultValues={editorDefaultValues}
        submitting={createMutation.isPending || updateMutation.isPending}
        editingUser={editingUser}
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
