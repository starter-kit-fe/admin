'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '../../../user/components/delete-confirm-dialog';
import { removeDictData } from '../../api';
import {
  useDictDataDeleteState,
  useDictManagementMutationCounter,
  useDictManagementRefresh,
} from '@/app/dashboard/system/dict/store';
import { resolveErrorMessage } from '../../utils';

export function DictDataDeleteDialog() {
  const { dataDeleteTarget, setDataDeleteTarget } = useDictDataDeleteState();
  const refresh = useDictManagementRefresh();
  const { beginMutation, endMutation } =
    useDictManagementMutationCounter();

  const deleteMutation = useMutation({
    mutationFn: ({
      dictTypeId,
      dictCode,
    }: {
      dictTypeId: number;
      dictCode: number;
    }) => removeDictData(dictTypeId, dictCode),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('字典项已删除');
      setDataDeleteTarget(null);
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '删除字典项失败'));
    },
    onSettled: () => {
      endMutation();
    },
  });

  return (
    <DeleteConfirmDialog
      open={dataDeleteTarget !== null}
      onOpenChange={(open) => {
        if (!open) {
          setDataDeleteTarget(null);
        }
      }}
      title="删除字典项"
      description={
        dataDeleteTarget
          ? `确定要删除字典项「${dataDeleteTarget.dictData.dictLabel}」吗？`
          : '确认删除所选字典项吗？'
      }
      loading={deleteMutation.isPending}
      onConfirm={() => {
        if (dataDeleteTarget) {
          deleteMutation.mutate({
            dictTypeId: dataDeleteTarget.dictType.dictId,
            dictCode: dataDeleteTarget.dictData.dictCode,
          });
        }
      }}
    />
  );
}
