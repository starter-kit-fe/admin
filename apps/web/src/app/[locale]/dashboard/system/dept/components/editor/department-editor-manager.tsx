'use client';

import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  createDepartment,
  updateDepartment,
} from '../../api';
import {
  useDepartmentEditorActions,
  useDepartmentEditorState,
  useDepartmentManagementMutationCounter,
  useDepartmentManagementRefresh,
  useDepartmentTreeState,
} from '@/app/dashboard/system/dept/store';
import type { DepartmentFormValues } from '../../type';
import {
  buildParentOptions,
  collectDescendantIds,
  resolveErrorMessage,
  toCreatePayload,
  toFormValues,
  toUpdatePayload,
} from '../../utils';
import { DepartmentEditorDialog } from './department-editor-dialog';
import { useTranslations } from 'next-intl';

export function DepartmentEditorManager() {
  const t = useTranslations('DepartmentManagement');
  const editorState = useDepartmentEditorState();
  const { closeEditor } = useDepartmentEditorActions();
  const { departmentTree } = useDepartmentTreeState();
  const refresh = useDepartmentManagementRefresh();
  const { beginMutation, endMutation } =
    useDepartmentManagementMutationCounter();

  const createMutation = useMutation({
    mutationFn: (values: DepartmentFormValues) =>
      createDepartment(toCreatePayload(values)),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(t('toast.createSuccess'));
      closeEditor();
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, t('toast.createError')));
    },
    onSettled: () => {
      endMutation();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      deptId,
      values,
    }: {
      deptId: number;
      values: DepartmentFormValues;
    }) => updateDepartment(deptId, toUpdatePayload(values)),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(t('toast.updateSuccess'));
      closeEditor();
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, t('toast.updateError')));
    },
    onSettled: () => {
      endMutation();
    },
  });

  const mode: 'create' | 'edit' =
    editorState.open && editorState.mode === 'edit' ? 'edit' : 'create';

  const editorDefaultValues = useMemo<DepartmentFormValues | undefined>(() => {
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
    return toFormValues(editorState.node);
  }, [editorState]);

  const parentOptions = useMemo(() => {
    const exclude = new Set<number>();
    if (editorState.open && editorState.mode === 'edit') {
      exclude.add(editorState.node.deptId);
      collectDescendantIds(editorState.node).forEach((id) => exclude.add(id));
    }
    return buildParentOptions(departmentTree, exclude);
  }, [departmentTree, editorState]);

  const handleSubmit = (values: DepartmentFormValues) => {
    if (!editorState.open) return;
    if (editorState.mode === 'create') {
      createMutation.mutate(values);
      return;
    }
    updateMutation.mutate({
      deptId: editorState.node.deptId,
      values,
    });
  };

  return (
    <DepartmentEditorDialog
      mode={mode}
      open={editorState.open}
      parentOptions={parentOptions}
      defaultValues={editorDefaultValues}
      submitting={createMutation.isPending || updateMutation.isPending}
      onOpenChange={(open) => {
        if (!open) {
          closeEditor();
        }
      }}
      onSubmit={handleSubmit}
    />
  );
}
