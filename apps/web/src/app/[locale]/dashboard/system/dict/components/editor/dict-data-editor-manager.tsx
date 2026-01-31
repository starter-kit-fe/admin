'use client';

import {
  useDictDataEditorActions,
  useDictDataEditorState,
  useDictManagementMutationCounter,
  useDictManagementRefresh,
} from '@/app/dashboard/system/dict/store';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { createDictData, updateDictData } from '../../api';
import type { DictDataFormValues } from '../../type';
import {
  normalizeOptional,
  resolveErrorMessage,
  toDictDataFormValues,
} from '../../utils';
import { DictDataEditorDialog } from './dict-data-editor-dialog';

export function DictDataEditorManager() {
  const t = useTranslations('DictManagement');
  const dataEditorState = useDictDataEditorState();
  const { closeDataEditor } = useDictDataEditorActions();
  const refresh = useDictManagementRefresh();
  const { beginMutation, endMutation } = useDictManagementMutationCounter();

  const createMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: DictDataFormValues }) =>
      createDictData(id, {
        dictLabel: values.dictLabel.trim(),
        dictValue: values.dictValue.trim(),
        dictSort: resolveSortValue(values.dictSort),
        status: values.status,
        isDefault: values.isDefault,
        remark: normalizeOptional(values.remark),
      }),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(t('toast.data.createSuccess'));
      closeDataEditor();
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, t('toast.data.createError')));
    },
    onSettled: () => {
      endMutation();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      dictId,
      id,
      values,
    }: {
      dictId: number;
      id: number;
      values: DictDataFormValues;
    }) =>
      updateDictData(dictId, id, {
        dictLabel: values.dictLabel.trim(),
        dictValue: values.dictValue.trim(),
        dictSort: resolveSortValue(values.dictSort),
        status: values.status,
        isDefault: values.isDefault,
        remark: normalizeOptional(values.remark),
      }),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(t('toast.data.updateSuccess'));
      closeDataEditor();
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, t('toast.data.updateError')));
    },
    onSettled: () => {
      endMutation();
    },
  });

  const mode: 'create' | 'edit' =
    dataEditorState.open && dataEditorState.mode === 'edit' ? 'edit' : 'create';

  const defaultValues = useMemo<DictDataFormValues | undefined>(() => {
    if (!dataEditorState.open || dataEditorState.mode === 'create') {
      return undefined;
    }
    return toDictDataFormValues(dataEditorState.dictData);
  }, [dataEditorState]);

  const submitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (values: DictDataFormValues) => {
    if (!dataEditorState.open) return;
    const dictId = dataEditorState.dictType.id;
    if (dataEditorState.mode === 'edit') {
      updateMutation.mutate({
        dictId,
        id: dataEditorState.dictData.id,
        values,
      });
      return;
    }
    createMutation.mutate({
      id: dictId,
      values,
    });
  };

  return (
    <DictDataEditorDialog
      mode={mode}
      open={dataEditorState.open}
      defaultValues={defaultValues}
      submitting={submitting}
      onOpenChange={(open) => {
        if (!open) {
          closeDataEditor();
        }
      }}
      onSubmit={handleSubmit}
    />
  );
}
const resolveSortValue = (value: string) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};
