'use client';

import { listMenuTree } from '@/app/dashboard/system/menu/api';
import {
  useRoleManagementMutationCounter,
  useRoleManagementRefresh,
  useRoleManagementStore,
} from '@/app/dashboard/system/role/store';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { createRole, getRoleDetail, updateRole } from '../../api';
import type { RoleFormValues } from '../../type';
import { toCreatePayload, toFormValues, toUpdatePayload } from '../../utils';
import { RoleEditorDialog } from './role-editor-dialog';

export function RoleEditorManager() {
  const { editorState, closeEditor } = useRoleManagementStore();
  const refresh = useRoleManagementRefresh();
  const { beginMutation, endMutation } = useRoleManagementMutationCounter();

  const menuTreeQuery = useQuery({
    queryKey: ['system', 'menus', 'tree'],
    queryFn: () => listMenuTree(),
    staleTime: 60_000,
  });

  const roleDetailQuery = useQuery({
    queryKey:
      editorState.open && editorState.mode === 'edit' && editorState.id != null
        ? ['system', 'roles', 'detail', editorState.id]
        : ['system', 'roles', 'detail', 'skip'],
    queryFn: async () => {
      if (
        !editorState.open ||
        editorState.mode !== 'edit' ||
        editorState.id == null
      ) {
        return null;
      }
      return getRoleDetail(editorState.id);
    },
    enabled:
      editorState.open && editorState.mode === 'edit' && editorState.id != null,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (values: RoleFormValues) => createRole(toCreatePayload(values)),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('角色创建成功');
      closeEditor();
      refresh();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : '创建角色失败，请稍后重试';
      toast.error(message);
    },
    onSettled: () => {
      endMutation();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: RoleFormValues }) =>
      updateRole(id, toUpdatePayload(values)),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('角色信息已更新');
      closeEditor();
      refresh();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : '更新角色失败，请稍后再试';
      toast.error(message);
    },
    onSettled: () => {
      endMutation();
    },
  });

  const mode: 'create' | 'edit' =
    editorState.open && editorState.mode === 'edit' ? 'edit' : 'create';

  const editorDefaultValues = useMemo<RoleFormValues | undefined>(() => {
    if (!editorState.open || editorState.mode === 'create') {
      return undefined;
    }
    if (roleDetailQuery.data) {
      return toFormValues(roleDetailQuery.data);
    }
    return undefined;
  }, [editorState, roleDetailQuery.data]);

  const handleSubmit = (values: RoleFormValues) => {
    if (editorState.open && editorState.mode === 'edit' && editorState.id) {
      updateMutation.mutate({ id: editorState.id, values });
      return;
    }
    createMutation.mutate(values);
  };

  return (
    <RoleEditorDialog
      mode={mode}
      open={editorState.open}
      defaultValues={editorDefaultValues}
      submitting={createMutation.isPending || updateMutation.isPending}
      loading={
        editorState.open &&
        editorState.mode === 'edit' &&
        roleDetailQuery.isFetching
      }
      menuTree={menuTreeQuery.data ?? []}
      menuTreeLoading={menuTreeQuery.isLoading}
      onOpenChange={(open) => {
        if (!open) {
          closeEditor();
        }
      }}
      onSubmit={handleSubmit}
    />
  );
}
