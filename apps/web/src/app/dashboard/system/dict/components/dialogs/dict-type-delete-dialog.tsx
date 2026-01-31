'use client';

import {
  useDictManagementMutationCounter,
  useDictManagementRefresh,
  useDictTypeDeleteState,
} from '@/app/dashboard/system/dict/store';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '../../../user/components/delete-confirm-dialog';
import { removeDictType } from '../../api';
import { resolveErrorMessage } from '../../utils';

export function DictTypeDeleteDialog() {
  const { typeDeleteTarget, setTypeDeleteTarget } = useDictTypeDeleteState();
  const refresh = useDictManagementRefresh();
  const { beginMutation, endMutation } = useDictManagementMutationCounter();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => removeDictType(id),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('字典类型已删除');
      setTypeDeleteTarget(null);
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '删除字典类型失败'));
    },
    onSettled: () => {
      endMutation();
    },
  });

  return (
    <DeleteConfirmDialog
      open={typeDeleteTarget !== null}
      onOpenChange={(open) => {
        if (!open) {
          setTypeDeleteTarget(null);
        }
      }}
      title="删除字典类型"
      description={
        typeDeleteTarget
          ? `确定要删除字典类型「${typeDeleteTarget.dictName}」吗？其字典项会同时清除。`
          : '确认删除所选字典类型吗？'
      }
      loading={deleteMutation.isPending}
      onConfirm={() => {
        if (typeDeleteTarget) {
          deleteMutation.mutate(typeDeleteTarget.id);
        }
      }}
    />
  );
}
