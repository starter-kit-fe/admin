'use client';

import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  createDictType,
  updateDictType,
  type CreateDictTypePayload,
  type UpdateDictTypePayload,
} from '../api';
import {
  useDictManagementMutationCounter,
  useDictManagementRefresh,
  useDictManagementStore,
} from '@/app/dashboard/system/dict/store';
import { resolveErrorMessage, toDictTypeFormValues } from '../utils';
import type { DictTypeFormValues } from '../type';
import { DictTypeEditorDialog } from './dict-type-editor-dialog';

export function DictTypeEditorManager() {
  const { typeEditorState, closeTypeEditor } = useDictManagementStore();
  const refresh = useDictManagementRefresh();
  const { beginMutation, endMutation } =
    useDictManagementMutationCounter();

  const createMutation = useMutation({
    mutationFn: (payload: CreateDictTypePayload) => createDictType(payload),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('新增字典类型成功');
      closeTypeEditor();
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '新增字典类型失败'));
    },
    onSettled: () => {
      endMutation();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateDictTypePayload;
    }) => updateDictType(id, payload),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('字典类型已更新');
      closeTypeEditor();
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '更新字典类型失败'));
    },
    onSettled: () => {
      endMutation();
    },
  });

  const mode: 'create' | 'edit' =
    typeEditorState.open && typeEditorState.mode === 'edit'
      ? 'edit'
      : 'create';

  const defaultValues = useMemo<DictTypeFormValues | undefined>(() => {
    if (!typeEditorState.open || typeEditorState.mode === 'create') {
      return undefined;
    }
    return toDictTypeFormValues(typeEditorState.dictType);
  }, [typeEditorState]);

  const submitting =
    createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (values: DictTypeFormValues) => {
    const payload: CreateDictTypePayload = {
      dictName: values.dictName.trim(),
      dictType: values.dictType.trim(),
      status: values.status,
      remark: values.remark?.trim() || undefined,
    };
    if (typeEditorState.open && typeEditorState.mode === 'edit') {
      updateMutation.mutate({
        id: typeEditorState.dictType.dictId,
        payload,
      });
      return;
    }
    createMutation.mutate(payload);
  };

  return (
    <DictTypeEditorDialog
      mode={mode}
      open={typeEditorState.open}
      defaultValues={defaultValues}
      submitting={submitting}
      onOpenChange={(open) => {
        if (!open) {
          closeTypeEditor();
        }
      }}
      onSubmit={handleSubmit}
    />
  );
}
