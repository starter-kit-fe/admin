'use client';

import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  createDictData,
  updateDictData,
} from '../api';
import {
  useDictManagementMutationCounter,
  useDictManagementRefresh,
  useDictManagementStore,
} from '@/app/dashboard/system/dict/store';
import {
  normalizeOptional,
  resolveErrorMessage,
  toDictDataFormValues,
} from '../utils';
import type { DictDataFormValues } from '../type';
import { DictDataEditorDialog } from './dict-data-editor-dialog';

export function DictDataEditorManager() {
  const { dataEditorState, closeDataEditor } = useDictManagementStore();
  const refresh = useDictManagementRefresh();
  const { beginMutation, endMutation } =
    useDictManagementMutationCounter();

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
      toast.success('新增字典项成功');
      closeDataEditor();
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '新增字典项失败'));
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
      toast.success('字典项已更新');
      closeDataEditor();
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '更新字典项失败'));
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
  const resolveSortValue = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  };
