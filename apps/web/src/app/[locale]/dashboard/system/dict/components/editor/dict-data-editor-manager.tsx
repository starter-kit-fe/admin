'use client';

import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { createDictData, updateDictData } from '../../api';
import {
  useDictDataEditorActions,
  useDictDataEditorState,
  useDictManagementMutationCounter,
  useDictManagementRefresh,
} from '@/app/dashboard/system/dict/store';
import {
  normalizeOptional,
  resolveErrorMessage,
  toDictDataFormValues,
} from '../../utils';
import type { DictDataFormValues } from '../../type';
import { DictDataEditorDialog } from './dict-data-editor-dialog';

const resolveSortValue = (value: string) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export function DictDataEditorManager() {
  const dataEditorState = useDictDataEditorState();
  const { closeDataEditor } = useDictDataEditorActions();
  const refresh = useDictManagementRefresh();
  const { beginMutation, endMutation } =
    useDictManagementMutationCounter();
  const tToast = useTranslations('DictManagement.toast.data');

  const createMutation = useMutation({
    mutationFn: ({
      dictTypeId,
      values,
    }: {
      dictTypeId: number;
      values: DictDataFormValues;
    }) =>
      createDictData(dictTypeId, {
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
      toast.success(tToast('createSuccess'));
      closeDataEditor();
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, tToast('createError')));
    },
    onSettled: () => {
      endMutation();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      dictTypeId,
      dictCode,
      values,
    }: {
      dictTypeId: number;
      dictCode: number;
      values: DictDataFormValues;
    }) =>
      updateDictData(dictTypeId, dictCode, {
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
      toast.success(tToast('updateSuccess'));
      closeDataEditor();
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, tToast('updateError')));
    },
    onSettled: () => {
      endMutation();
    },
  });

  const mode: 'create' | 'edit' =
    dataEditorState.open && dataEditorState.mode === 'edit'
      ? 'edit'
      : 'create';

  const defaultValues = useMemo<DictDataFormValues | undefined>(() => {
    if (!dataEditorState.open || dataEditorState.mode === 'create') {
      return undefined;
    }
    return toDictDataFormValues(dataEditorState.dictData);
  }, [dataEditorState]);

  const submitting =
    createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (values: DictDataFormValues) => {
    if (!dataEditorState.open) return;
    const dictTypeId = dataEditorState.dictType.dictId;
    if (dataEditorState.mode === 'edit') {
      updateMutation.mutate({
        dictTypeId,
        dictCode: dataEditorState.dictData.dictCode,
        values,
      });
      return;
    }
    createMutation.mutate({
      dictTypeId,
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
