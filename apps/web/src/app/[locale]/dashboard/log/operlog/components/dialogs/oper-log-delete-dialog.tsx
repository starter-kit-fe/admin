'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '@/app/dashboard/system/user/components/delete-confirm-dialog';

import { removeOperLog } from '../../api';
import {
  useOperLogManagementMutationCounter,
  useOperLogManagementRefresh,
  useOperLogManagementStore,
} from '../../store';
import { resolveErrorMessage } from '../../utils';

export function OperLogDeleteDialog() {
  const { deleteTarget, setDeleteTarget } = useOperLogManagementStore();
  const refresh = useOperLogManagementRefresh();
  const { beginMutation, endMutation } =
    useOperLogManagementMutationCounter();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => removeOperLog(id),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('操作日志已删除');
      setDeleteTarget(null);
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '删除操作日志失败'));
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
      title="删除操作日志"
      description={
        deleteTarget
          ? `确定要删除操作「${deleteTarget.title || '未命名'}」的日志记录吗？`
          : '确定要删除所选操作日志吗？'
      }
      loading={deleteMutation.isPending}
      onConfirm={() => {
        if (deleteTarget) {
          deleteMutation.mutate(deleteTarget.operId);
        }
      }}
    />
  );
}
