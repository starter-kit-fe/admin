'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
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
const BASE_QUERY_KEY = ['system', 'roles', 'list'] as const;

type StatusValue = (typeof STATUS_TABS)[number]['value'];

type ViewState = {
  status: StatusValue;
  keyword: string;
  pageNum: number;
  pageSize: number;
};

type ViewAction =
  | { type: 'set-status'; status: StatusValue }
  | { type: 'set-keyword'; keyword: string }
  | { type: 'set-page'; pageNum: number }
  | { type: 'set-page-size'; pageSize: number }
  | { type: 'reset' };

const INITIAL_VIEW_STATE: ViewState = {
  status: 'all',
  keyword: '',
  ...DEFAULT_PAGE,
};

function viewStateReducer(state: ViewState, action: ViewAction): ViewState {
  switch (action.type) {
    case 'set-status': {
      if (state.status === action.status) return state;
      return { ...state, status: action.status, pageNum: 1 };
    }
    case 'set-keyword': {
      if (state.keyword === action.keyword) return state;
      return { ...state, keyword: action.keyword, pageNum: 1 };
    }
    case 'set-page': {
      if (state.pageNum === action.pageNum) return state;
      return { ...state, pageNum: action.pageNum };
    }
    case 'set-page-size': {
      if (state.pageSize === action.pageSize) return state;
      return { ...state, pageNum: 1, pageSize: action.pageSize };
    }
    case 'reset':
      return INITIAL_VIEW_STATE;
    default:
      return state;
  }
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  const latest = useRef(value);

  useEffect(() => {
    latest.current = value;
    const timer = window.setTimeout(() => {
      setDebounced(latest.current);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delay]);

  return debounced;
}

function toFormValues(role: Role): RoleFormValues {
  return {
    roleName: role.roleName ?? '',
    roleKey: role.roleKey ?? '',
    roleSort: role.roleSort != null ? String(role.roleSort) : '',
    dataScope: (['1', '2', '3', '4', '5'].includes(role.dataScope) ? role.dataScope : '1') as RoleFormValues['dataScope'],
    menuCheckStrictly: role.menuCheckStrictly,
    deptCheckStrictly: role.deptCheckStrictly,
    status: role.status ?? '0',
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

type EditorState =
  | { open: false; mode: 'create' | 'edit'; roleId: null }
  | { open: true; mode: 'create'; roleId: null }
  | { open: true; mode: 'edit'; roleId: number };

const INITIAL_EDITOR_STATE: EditorState = { open: false, mode: 'create', roleId: null };

export function RoleManagement() {
  const queryClient = useQueryClient();
  const [viewState, dispatchViewState] = useReducer(viewStateReducer, INITIAL_VIEW_STATE);
  const [keywordInput, setKeywordInput] = useState('');
  const debouncedKeyword = useDebouncedValue(keywordInput.trim(), 350);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [editorState, setEditorState] = useState<EditorState>(INITIAL_EDITOR_STATE);

  // sync debounced keyword into view state
  useEffect(() => {
    dispatchViewState({ type: 'set-keyword', keyword: debouncedKeyword });
  }, [debouncedKeyword]);

  // keep input aligned when keyword reset from actions
  useEffect(() => {
    if (viewState.keyword === '') {
      setKeywordInput('');
    }
  }, [viewState.keyword]);

  const queryKey = useMemo(
    () => [
      ...BASE_QUERY_KEY,
      viewState.status,
      viewState.keyword,
      viewState.pageNum,
      viewState.pageSize,
    ],
    [viewState.status, viewState.keyword, viewState.pageNum, viewState.pageSize],
  );

  const roleListQuery = useQuery({
    queryKey,
    queryFn: () =>
      listRoles({
        pageNum: viewState.pageNum,
        pageSize: viewState.pageSize,
        status: viewState.status === 'all' ? undefined : viewState.status,
        roleName: viewState.keyword || undefined,
      }),
    select: (data: RoleListResponse) => data,
  });

  const rows = roleListQuery.data?.items ?? [];
  const total = roleListQuery.data?.total ?? 0;

  useEffect(() => {
    setSelectedIds((prev) => {
      if (rows.length === 0) {
        return prev.size === 0 ? prev : new Set();
      }
      const next = new Set<number>();
      rows.forEach((role) => {
        if (prev.has(role.roleId)) {
          next.add(role.roleId);
        }
      });

      if (next.size === prev.size) {
        let identical = true;
        for (const id of next) {
          if (!prev.has(id)) {
            identical = false;
            break;
          }
        }
        if (identical) {
          return prev;
        }
      }

      return next;
    });
  }, [rows]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [viewState.status, viewState.keyword]);

  const menuTreeQuery = useQuery({
    queryKey: ['system', 'menus', 'tree'],
    queryFn: () => listMenuTree(),
  });
  const menuTree: MenuTreeNode[] = menuTreeQuery.data ?? [];

  const createMutation = useMutation({
    mutationFn: (values: RoleFormValues) => createRole(toCreatePayload(values)),
    onSuccess: () => {
      toast.success('角色创建成功');
      setEditorState(INITIAL_EDITOR_STATE);
      void queryClient.invalidateQueries({ queryKey: BASE_QUERY_KEY });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '创建角色失败，请稍后重试';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: RoleFormValues }) =>
      updateRole(id, toUpdatePayload(values)),
    onSuccess: () => {
      toast.success('角色信息已更新');
      setEditorState(INITIAL_EDITOR_STATE);
      void queryClient.invalidateQueries({ queryKey: BASE_QUERY_KEY });
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
      void queryClient.invalidateQueries({ queryKey: BASE_QUERY_KEY });
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
      void queryClient.invalidateQueries({ queryKey: BASE_QUERY_KEY });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '批量删除失败，请稍后再试';
      toast.error(message);
    },
  });

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

  const roleDetailQuery = useQuery({
    queryKey: editorState.mode === 'edit' && editorState.roleId != null ? ['system', 'roles', 'detail', editorState.roleId] : ['system', 'roles', 'detail', 'skip'],
    queryFn: async () => {
      if (!editorState.open || editorState.mode !== 'edit' || editorState.roleId == null) {
        return null;
      }
      return getRoleDetail(editorState.roleId);
    },
    enabled: editorState.open && editorState.mode === 'edit' && editorState.roleId != null,
    staleTime: 30_000,
  });

  const editorDefaultValues = useMemo(() => {
    if (!editorState.open || editorState.mode === 'create') {
      return undefined;
    }
    if (roleDetailQuery.data) {
      return toFormValues(roleDetailQuery.data);
    }
    if (editorState.roleId != null) {
      const fallback = rows.find((role) => role.roleId === editorState.roleId);
      if (fallback) {
        return toFormValues({ ...fallback, menuIds: fallback.menuIds ?? [] });
      }
    }
    return undefined;
  }, [editorState, roleDetailQuery.data, rows]);

  const handleStatusChange = useCallback((nextStatus: string) => {
    dispatchViewState({ type: 'set-status', status: nextStatus as StatusValue });
  }, []);

  const handleKeywordInputChange = useCallback((value: string) => {
    setKeywordInput(value);
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

  const handlePageChange = useCallback((pageNum: number) => {
    dispatchViewState({ type: 'set-page', pageNum });
    setSelectedIds(new Set());
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    dispatchViewState({ type: 'set-page-size', pageSize });
    setSelectedIds(new Set());
  }, []);

  const handleRefresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: BASE_QUERY_KEY });
  }, [queryClient]);

  const openCreateDialog = useCallback(() => {
    setEditorState({ open: true, mode: 'create', roleId: null });
  }, []);

  const openEditDialog = useCallback((role: Role) => {
    setEditorState({ open: true, mode: 'edit', roleId: role.roleId });
  }, []);

  const handleEditorSubmit = useCallback(
    (values: RoleFormValues) => {
      if (editorState.mode === 'create') {
        createMutation.mutate(values);
      } else if (editorState.mode === 'edit' && editorState.roleId != null) {
        updateMutation.mutate({ id: editorState.roleId, values });
      }
    },
    [createMutation, updateMutation, editorState],
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

  const closeEditor = useCallback(() => {
    setEditorState(INITIAL_EDITOR_STATE);
  }, []);

  const isMutating = createMutation.isPending || updateMutation.isPending;
  const isRefreshing = roleListQuery.isFetching;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
      <RoleManagementHeader
        onRefresh={handleRefresh}
        onCreate={openCreateDialog}
        disableActions={isMutating}
        isRefreshing={isRefreshing}
      />

      <RoleManagementFilters
        status={viewState.status}
        onStatusChange={handleStatusChange}
        keyword={keywordInput}
        onKeywordChange={handleKeywordInputChange}
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
        currentPage={viewState.pageNum}
        pageSize={viewState.pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        disabled={isRefreshing}
      />

      <RoleEditorDialog
        mode={editorState.mode}
        open={editorState.open}
        defaultValues={editorDefaultValues}
        submitting={createMutation.isPending || updateMutation.isPending}
        loading={editorState.mode === 'edit' && roleDetailQuery.isLoading}
        menuTree={menuTree}
        menuTreeLoading={menuTreeQuery.isLoading}
        onOpenChange={(open) => {
          if (open) {
            setEditorState((prev) =>
              prev.mode === 'edit' && prev.roleId != null
                ? { open: true, mode: 'edit', roleId: prev.roleId }
                : { open: true, mode: 'create', roleId: null },
            );
          } else {
            closeEditor();
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
