'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { PaginationToolbar } from '@/components/pagination/pagination-toolbar';

import { SelectionBanner } from '../user/components/selection-banner';
import { DeleteConfirmDialog } from '../user/components/delete-confirm-dialog';

import { createRole, getRoleDetail, listRoles, removeRole, updateRole } from './api';
import { listMenuTree } from '../menu/api';
import type { MenuTreeNode } from '../menu/type';
import { RoleEditorDialog } from './components/role-editor-dialog';
import { RoleManagementFilters } from './components/role-management-filters';
import { RoleManagementHeader } from './components/role-management-header';
import { RoleTable } from './components/role-table';
import type { Role, RoleFormValues, RoleListResponse } from './type';

const STATUS_TABS = [
  { value: 'all', label: '全部' },
  { value: '0', label: '启用' },
  { value: '1', label: '停用' },
] as const;

const DEFAULT_PAGE = { pageNum: 1, pageSize: 10 };
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

function toFormValues(role: Role): RoleFormValues {
  return {
    roleName: role.roleName,
    roleKey: role.roleKey,
    roleSort: String(role.roleSort ?? ''),
    dataScope: (['1', '2', '3', '4', '5'].includes(role.dataScope) ? role.dataScope : '1') as RoleFormValues['dataScope'],
    menuCheckStrictly: role.menuCheckStrictly,
    deptCheckStrictly: role.deptCheckStrictly,
    status: role.status,
    remark: role.remark ?? '',
    menuIds: role.menuIds ?? [],
  };
}

function toCreatePayload(values: RoleFormValues) {
  return {
    roleName: values.roleName.trim(),
    roleKey: values.roleKey.trim(),
    roleSort: values.roleSort === '' ? undefined : Number(values.roleSort),
    dataScope: values.dataScope,
    menuCheckStrictly: values.menuCheckStrictly,
    deptCheckStrictly: values.deptCheckStrictly,
    status: values.status,
    remark: values.remark.trim() === '' ? undefined : values.remark.trim(),
    menuIds: values.menuIds,
  };
}

function toUpdatePayload(values: RoleFormValues) {
  return {
    roleName: values.roleName.trim(),
    roleKey: values.roleKey.trim(),
    roleSort: values.roleSort === '' ? undefined : Number(values.roleSort),
    dataScope: values.dataScope,
    menuCheckStrictly: values.menuCheckStrictly,
    deptCheckStrictly: values.deptCheckStrictly,
    status: values.status,
    remark: values.remark.trim() === '' ? undefined : values.remark.trim(),
    menuIds: values.menuIds,
  };
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delay]);

  return debounced;
}

export function RoleManagement() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]['value']>('all');
  const [keyword, setKeyword] = useState('');
  const [pagination, setPagination] = useState(DEFAULT_PAGE);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingRoleDetail, setEditingRoleDetail] = useState<Role | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const debouncedKeyword = useDebouncedValue(keyword.trim(), 400);

  useEffect(() => {
    setPagination(DEFAULT_PAGE);
    setSelectedIds(new Set());
  }, [status, debouncedKeyword]);

  const queryKey = useMemo(
    () => ['system', 'roles', status, debouncedKeyword, pagination.pageNum, pagination.pageSize],
    [status, debouncedKeyword, pagination.pageNum, pagination.pageSize],
  );

  const roleListQuery = useQuery({
    queryKey,
    queryFn: () =>
      listRoles({
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize,
        status: status === 'all' ? undefined : status,
        roleName: debouncedKeyword || undefined,
      }),
    select: (data: RoleListResponse) => data,
  });

  const rows = roleListQuery.data?.items ?? [];
  const total = roleListQuery.data?.total ?? 0;

  const menuTreeQuery = useQuery({
    queryKey: ['system', 'menus', 'tree'],
    queryFn: () => listMenuTree(),
  });

  const menuTree: MenuTreeNode[] = menuTreeQuery.data ?? [];

  const createMutation = useMutation({
    mutationFn: (values: RoleFormValues) => createRole(toCreatePayload(values)),
    onSuccess: () => {
      toast.success('角色创建成功');
      setEditorOpen(false);
      setEditingRole(null);
      setEditingRoleDetail(null);
      refetchRoles();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '创建角色失败，请稍后重试';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: RoleFormValues }) => updateRole(id, toUpdatePayload(values)),
    onSuccess: () => {
      toast.success('角色信息已更新');
      setEditorOpen(false);
      setEditingRole(null);
      setEditingRoleDetail(null);
      refetchRoles();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '更新角色失败，请稍后再试';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (roleId: number) => removeRole(roleId),
    onSuccess: () => {
      toast.success('角色已删除');
      setDeleteTarget(null);
      refetchRoles();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '删除角色失败，请稍后再试';
      toast.error(message);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => removeRole(id)));
    },
    onSuccess: () => {
      toast.success('批量删除成功');
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      refetchRoles();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '批量删除失败，请稍后再试';
      toast.error(message);
    },
  });

  useEffect(() => {
    setSelectedIds((prev) => {
      if (rows.length === 0) {
        return new Set();
      }
      const next = new Set<number>();
      rows.forEach((role) => {
        if (prev.has(role.roleId)) {
          next.add(role.roleId);
        }
      });
      return next;
    });
  }, [rows]);

  const statusTabs = useMemo(
    () =>
      STATUS_TABS.map((tab) => ({
        value: tab.value,
        label: tab.label,
        count: undefined,
      })),
    [],
  );

  const selectedCount = selectedIds.size;
  const isAllSelected = rows.length > 0 && rows.every((row) => selectedIds.has(row.roleId));
  const headerCheckboxState = isAllSelected ? true : selectedCount > 0 ? ('indeterminate' as const) : false;

  const editorDefaultValues = useMemo(() => {
    if (editorMode === 'edit') {
      if (editingRoleDetail) {
        return toFormValues(editingRoleDetail);
      }
      if (editingRole) {
        return toFormValues({ ...editingRole, menuIds: editingRole.menuIds ?? [] });
      }
    }
    return undefined;
  }, [editorMode, editingRole, editingRoleDetail]);

  const handleStatusChange = useCallback((value: string) => {
    setStatus(value as (typeof STATUS_TABS)[number]['value']);
  }, []);

  const handleKeywordChange = useCallback((value: string) => {
    setKeyword(value);
  }, []);

  const handleToggleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(new Set(rows.map((row) => row.roleId)));
      } else {
        setSelectedIds(new Set());
      }
    },
    [rows],
  );

  const handleToggleSelectRow = useCallback((roleId: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(roleId);
      } else {
        next.delete(roleId);
      }
      return next;
    });
  }, []);

  const openCreateDialog = useCallback(() => {
    setEditorMode('create');
    setEditingRole(null);
    setEditingRoleDetail(null);
    setEditorOpen(true);
  }, []);

  const openEditDialog = useCallback((role: Role) => {
    setEditorMode('edit');
    setEditingRole(role);
    setEditingRoleDetail(null);
    setEditorOpen(true);
    setEditorLoading(true);
    getRoleDetail(role.roleId)
      .then((detail) => {
        setEditingRoleDetail(detail);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : '加载角色详情失败';
        toast.error(message);
      })
      .finally(() => {
        setEditorLoading(false);
      });
  }, []);

  const handleEditorSubmit = useCallback(
    (values: RoleFormValues) => {
      if (editorMode === 'create') {
        createMutation.mutate(values);
      } else if (editingRole) {
        updateMutation.mutate({ id: editingRole.roleId, values });
      }
    },
    [createMutation, editorMode, editingRole, updateMutation],
  );

  const handleDeleteRole = useCallback((role: Role) => {
    setDeleteTarget(role);
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (selectedCount === 0) {
      toast.info('请先选择需要删除的角色');
      return;
    }
    setBulkDeleteOpen(true);
  }, [selectedCount]);

  const handlePageChange = useCallback((pageNum: number) => {
    setPagination((prev) => ({ ...prev, pageNum }));
    setSelectedIds(new Set());
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setPagination({ pageNum: 1, pageSize });
    setSelectedIds(new Set());
  }, []);

  const refetchRoles = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['system', 'roles'] });
  }, [queryClient]);

  const isMutating = createMutation.isPending || updateMutation.isPending;
  const isRefreshing = roleListQuery.isFetching;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
      <RoleManagementHeader
        onRefresh={refetchRoles}
        onCreate={openCreateDialog}
        disableActions={isMutating}
        isRefreshing={isRefreshing}
      />

      <RoleManagementFilters
        status={status}
        onStatusChange={handleStatusChange}
        keyword={keyword}
        onKeywordChange={handleKeywordChange}
        statusTabs={statusTabs}
      />

      <SelectionBanner
        count={selectedCount}
        onClear={() => setSelectedIds(new Set())}
        onBulkDelete={handleBulkDelete}
      />

      <RoleTable
        rows={rows}
        headerCheckboxState={headerCheckboxState}
        onToggleSelectAll={handleToggleSelectAll}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelectRow}
        onEdit={openEditDialog}
        onDelete={handleDeleteRole}
        isLoading={roleListQuery.isLoading}
        isError={roleListQuery.isError}
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

      <RoleEditorDialog
        mode={editorMode}
        open={editorOpen}
        defaultValues={editorDefaultValues}
        submitting={createMutation.isPending || updateMutation.isPending}
        loading={editorLoading}
        menuTree={menuTree}
        menuTreeLoading={menuTreeQuery.isLoading}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) {
            setEditingRole(null);
            setEditingRoleDetail(null);
            setEditorLoading(false);
          }
        }}
        onSubmit={handleEditorSubmit}
      />

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="删除角色"
        description={
          deleteTarget
            ? `确定要删除角色「${deleteTarget.roleName}」吗？该操作无法撤销。`
            : '确认删除所选角色吗？'
        }
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.roleId);
          }
        }}
      />

      <DeleteConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="批量删除角色"
        description={`将删除选中的 ${selectedCount} 个角色，操作不可恢复。`}
        confirmLabel="批量删除"
        loading={bulkDeleteMutation.isPending}
        onConfirm={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
      />
    </div>
  );
}
