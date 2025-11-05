'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { StatusTabItem } from '@/components/status-tabs';
import { InlineLoading } from '@/components/loading';
import { Button } from '@/components/ui/button';

import { DeleteConfirmDialog } from '../user/components/delete-confirm-dialog';
import {
  createDepartment,
  listDepartmentTree,
  removeDepartment,
  updateDepartment,
} from './api';
import {
  type CreateDepartmentPayload,
  type DepartmentFormValues,
  type DepartmentNode,
  type DepartmentParentOption,
  type UpdateDepartmentPayload,
} from './type';
import { DepartmentEditorDialog } from './components/department-editor-dialog';
import { DepartmentFilters } from './components/department-filters';
import { DepartmentManagementHeader } from './components/department-management-header';
import { DepartmentTreeView } from './components/department-tree-view';

const STATUS_TABS = [
  { value: 'all', label: '全部' },
  { value: '0', label: '正常' },
  { value: '1', label: '停用' },
] as const;

type StatusValue = (typeof STATUS_TABS)[number]['value'];

type EditorState =
  | { open: false }
  | { open: true; mode: 'create'; parentId: number }
  | { open: true; mode: 'edit'; department: DepartmentNode };

interface DeleteState {
  open: boolean;
  node?: DepartmentNode;
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

function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  return fallback;
}

function toFormValues(node: DepartmentNode): DepartmentFormValues {
  return {
    deptName: node.deptName ?? '',
    parentId: String(node.parentId ?? 0),
    orderNum: String(node.orderNum ?? 0),
    leader: node.leader ?? '',
    phone: node.phone ?? '',
    email: node.email ?? '',
    status: node.status,
    remark: node.remark ?? '',
  };
}

function normalizeOptional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function toCreatePayload(values: DepartmentFormValues): CreateDepartmentPayload {
  const orderNum = values.orderNum.trim() === '' ? 0 : Number(values.orderNum);
  return {
    deptName: values.deptName.trim(),
    parentId: Number(values.parentId) || 0,
    orderNum: Number.isNaN(orderNum) ? 0 : orderNum,
    leader: normalizeOptional(values.leader) ?? null,
    phone: normalizeOptional(values.phone) ?? null,
    email: normalizeOptional(values.email) ?? null,
    status: values.status,
    remark: normalizeOptional(values.remark) ?? null,
  };
}

function toUpdatePayload(values: DepartmentFormValues): UpdateDepartmentPayload {
  return toCreatePayload(values);
}

function collectDescendantIds(node?: DepartmentNode): number[] {
  if (!node?.children || node.children.length === 0) {
    return [];
  }
  const result: number[] = [];
  const stack = [...node.children];
  while (stack.length > 0) {
    const current = stack.pop()!;
    result.push(current.deptId);
    if (current.children && current.children.length > 0) {
      stack.push(...current.children);
    }
  }
  return result;
}

function buildParentOptions(
  nodes: DepartmentNode[],
  excludeIds: Set<number>,
): DepartmentParentOption[] {
  const options: DepartmentParentOption[] = [
    {
      value: '0',
      label: '顶级部门',
      level: 0,
      path: ['顶级部门'],
      disabled: excludeIds.has(0),
    },
  ];

  const walk = (
    items: DepartmentNode[],
    depth: number,
    ancestors: string[],
  ) => {
    items.forEach((item) => {
      const path = [...ancestors, item.deptName];
      options.push({
        value: String(item.deptId),
        label: item.deptName,
        level: depth,
        path,
        parentId: String(item.parentId),
        disabled: excludeIds.has(item.deptId),
      });
      if (item.children && item.children.length > 0) {
        walk(item.children, depth + 1, path);
      }
    });
  };

  walk(nodes, 1, []);
  return options;
}

export function DeptManagement() {
  const [status, setStatus] = useState<StatusValue>('all');
  const [keyword, setKeyword] = useState('');
  const [editorState, setEditorState] = useState<EditorState>({ open: false });
  const [deleteState, setDeleteState] = useState<DeleteState>({ open: false });

  const debouncedKeyword = useDebouncedValue(keyword.trim(), 400);

  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['system', 'departments', 'tree', status, debouncedKeyword],
    queryFn: () =>
      listDepartmentTree({
        status: status === 'all' ? undefined : status,
        deptName: debouncedKeyword || undefined,
      }),
  });

  const nodes: DepartmentNode[] = query.data ?? [];

  const statusTabs = useMemo<StatusTabItem[]>(
    () =>
      STATUS_TABS.map((tab) => ({
        value: tab.value,
        label: tab.label,
      })),
    [],
  );

  const invalidateTree = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['system', 'departments', 'tree'] });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateDepartmentPayload) => createDepartment(payload),
    onSuccess: () => {
      toast.success('新增部门成功');
      setEditorState({ open: false });
      invalidateTree();
    },
    onError: (error: unknown) => {
      toast.error(resolveErrorMessage(error, '新增部门失败'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      deptId,
      payload,
    }: {
      deptId: number;
      payload: UpdateDepartmentPayload;
    }) => updateDepartment(deptId, payload),
    onSuccess: () => {
      toast.success('更新部门成功');
      setEditorState({ open: false });
      invalidateTree();
    },
    onError: (error: unknown) => {
      toast.error(resolveErrorMessage(error, '更新部门失败'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (deptId: number) => removeDepartment(deptId),
    onSuccess: () => {
      toast.success('删除部门成功');
      setDeleteState({ open: false });
      invalidateTree();
    },
    onError: (error: unknown) => {
      toast.error(resolveErrorMessage(error, '删除部门失败'));
    },
  });

  const handleStatusChange = useCallback((value: string) => {
    setStatus(value as StatusValue);
  }, []);

  const handleAddRoot = useCallback(() => {
    setEditorState({ open: true, mode: 'create', parentId: 0 });
  }, []);

  const handleAddChild = useCallback((node: DepartmentNode) => {
    setEditorState({ open: true, mode: 'create', parentId: node.deptId });
  }, []);

  const handleEdit = useCallback((node: DepartmentNode) => {
    setEditorState({ open: true, mode: 'edit', department: node });
  }, []);

  const handleDelete = useCallback((node: DepartmentNode) => {
    setDeleteState({ open: true, node });
  }, []);

  const handleEditorOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setEditorState({ open: false });
    }
  }, []);

  const handleEditorSubmit = useCallback(
    (values: DepartmentFormValues) => {
      if (!editorState.open) {
        return;
      }
      if (editorState.mode === 'create') {
        createMutation.mutate(toCreatePayload(values));
        return;
      }
      updateMutation.mutate({
        deptId: editorState.department.deptId,
        payload: toUpdatePayload(values),
      });
    },
    [createMutation, editorState, updateMutation],
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteState.node) {
      return;
    }
    deleteMutation.mutate(deleteState.node.deptId);
  }, [deleteMutation, deleteState.node]);

  const handleDeleteOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setDeleteState({ open: false });
    }
  }, []);

  const editorDefaults = useMemo<DepartmentFormValues | undefined>(() => {
    if (!editorState.open) {
      return undefined;
    }
    if (editorState.mode === 'create') {
      return {
        deptName: '',
        parentId: String(editorState.parentId ?? 0),
        orderNum: '0',
        leader: '',
        phone: '',
        email: '',
        status: '0',
        remark: '',
      };
    }
    return toFormValues(editorState.department);
  }, [editorState]);

  const parentOptions = useMemo<DepartmentParentOption[]>(() => {
    const exclude = new Set<number>();
    if (editorState.open && editorState.mode === 'edit') {
      exclude.add(editorState.department.deptId);
      collectDescendantIds(editorState.department).forEach((id) =>
        exclude.add(id),
      );
    }
    return buildParentOptions(nodes, exclude);
  }, [editorState, nodes]);

  const dialogSubmitting = editorState.open
    ? editorState.mode === 'create'
      ? createMutation.isPending
      : updateMutation.isPending
    : false;

  const isRefreshing = query.isFetching;

  const handleRefresh = () => {
    void query.refetch();
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 pb-10">
      <DepartmentManagementHeader
        onRefresh={handleRefresh}
        onCreateRoot={handleAddRoot}
        disableActions={dialogSubmitting}
        isRefreshing={isRefreshing}
      />

      <DepartmentFilters
        status={status}
        tabs={statusTabs}
        onStatusChange={handleStatusChange}
        keyword={keyword}
        onKeywordChange={setKeyword}
      />

      <section className="flex max-h-[520px] flex-col overflow-hidden rounded-xl border border-border/60 bg-card p-3 shadow-sm dark:border-border/40">
        {query.isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <InlineLoading label="加载中" />
          </div>
        ) : query.isError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-destructive">
            加载部门数据失败，请稍后再试。
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => query.refetch()}
            >
              重新加载
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto rounded-lg bg-muted/20 p-3 dark:bg-muted/10">
            <DepartmentTreeView
              nodes={nodes}
              onAddChild={handleAddChild}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        )}
      </section>

      <DepartmentEditorDialog
        mode={editorState.open ? editorState.mode : 'create'}
        open={editorState.open}
        defaultValues={editorDefaults}
        parentOptions={parentOptions}
        submitting={dialogSubmitting}
        onOpenChange={handleEditorOpenChange}
        onSubmit={handleEditorSubmit}
      />

      <DeleteConfirmDialog
        open={deleteState.open}
        onOpenChange={handleDeleteOpenChange}
        loading={deleteMutation.isPending}
        title="删除部门"
        description={
          deleteState.node
            ? `确认删除「${deleteState.node.deptName}」及其所有子部门吗？`
            : '确认删除该部门吗？'
        }
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
