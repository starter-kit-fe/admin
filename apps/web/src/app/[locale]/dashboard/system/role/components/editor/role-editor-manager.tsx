'use client';

import { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { createRole, getRoleDetail, updateRole } from '../../api';
import { listMenuTree } from '@/app/dashboard/system/menu/api';
import { RoleEditorDialog } from './role-editor-dialog';
import {
  useRoleManagementMutationCounter,
  useRoleManagementRefresh,
  useRoleManagementStore,
} from '@/app/dashboard/system/role/store';
import type { RoleFormValues } from '../../type';
import { toCreatePayload, toFormValues, toUpdatePayload } from '../../utils';
import { useTranslations } from 'next-intl';

export function RoleEditorManager() {
  const t = useTranslations('RoleManagement');
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
      editorState.open && editorState.mode === 'edit' && editorState.roleId != null
        ? ['system', 'roles', 'detail', editorState.roleId]
        : ['system', 'roles', 'detail', 'skip'],
    queryFn: async () => {
      if (
        !editorState.open ||
        editorState.mode !== 'edit' ||
        editorState.roleId == null
      ) {
        return null;
      }
      return getRoleDetail(editorState.roleId);
    },
    enabled:
      editorState.open &&
      editorState.mode === 'edit' &&
      editorState.roleId != null,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (values: RoleFormValues) => createRole(toCreatePayload(values)),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(t('toast.createSuccess'));
      closeEditor();
      refresh();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : t('toast.createError');
      toast.error(message);
    },
    onSettled: () => {
      endMutation();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      roleId,
      values,
    }: {
      roleId: number;
      values: RoleFormValues;
    }) => updateRole(roleId, toUpdatePayload(values)),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(t('toast.updateSuccess'));
      closeEditor();
      refresh();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : t('toast.updateError');
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
    if (editorState.open && editorState.mode === 'edit' && editorState.roleId) {
      updateMutation.mutate({ roleId: editorState.roleId, values });
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
