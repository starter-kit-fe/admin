'use client';

import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  createDictType,
  updateDictType,
  type CreateDictTypePayload,
  type UpdateDictTypePayload,
} from '../../api';
import {
  useDictManagementMutationCounter,
  useDictManagementRefresh,
  useDictTypeEditorActions,
  useDictTypeEditorState,
} from '@/app/dashboard/system/dict/store';
import { resolveErrorMessage, toDictTypeFormValues } from '../../utils';
import type { DictTypeFormValues } from '../../type';
import { DictTypeEditorDialog } from './dict-type-editor-dialog';
import { useTranslations } from 'next-intl';

export function DictTypeEditorManager() {
  const t = useTranslations('DictManagement');
  const typeEditorState = useDictTypeEditorState();
  const { closeTypeEditor } = useDictTypeEditorActions();
  const refresh = useDictManagementRefresh();
  const { beginMutation, endMutation } =
    useDictManagementMutationCounter();

  const createMutation = useMutation({
    mutationFn: (payload: CreateDictTypePayload) => createDictType(payload),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(t('toast.type.createSuccess'));
      closeTypeEditor();
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, t('toast.type.createError')));
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
      toast.success(t('toast.type.updateSuccess'));
      closeTypeEditor();
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, t('toast.type.updateError')));
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
