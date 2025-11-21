'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '@/app/dashboard/system/user/components/delete-confirm-dialog';
import { removeConfig } from '../../api';
import {
  useConfigDeleteState,
  useConfigManagementMutationCounter,
  useConfigManagementRefresh,
} from '@/app/dashboard/system/config/store';
import { resolveErrorMessage } from '../../utils';

export function ConfigDeleteDialog() {
  const { deleteTarget, setDeleteTarget } = useConfigDeleteState();
  const refresh = useConfigManagementRefresh();
  const { beginMutation, endMutation } =
    useConfigManagementMutationCounter();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => removeConfig(id),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('参数已删除');
      setDeleteTarget(null);
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '删除参数失败'));
    },
    onSettled: () => {
      endMutation();
    },
  });

  return (
    <DeleteConfirmDialog
      open={deleteTarget !== null}
      onOpenChange={(open) => {
        if (!open) {
          setDeleteTarget(null);
        }
      }}
      title="删除参数"
      description={
        deleteTarget
          ? `确定要删除参数「${deleteTarget.configName}」吗？`
          : '确认删除所选参数吗？'
      }
      loading={deleteMutation.isPending}
      onConfirm={() => {
        if (deleteTarget) {
          deleteMutation.mutate(deleteTarget.configId);
        }
      }}
    />
  );
}
