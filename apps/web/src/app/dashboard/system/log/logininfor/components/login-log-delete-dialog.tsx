'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '@/app/dashboard/system/user/components/delete-confirm-dialog';

import { removeLoginLog } from '../api';
import {
  useLoginLogManagementMutationCounter,
  useLoginLogManagementRefresh,
  useLoginLogManagementStore,
} from '../store';
import { resolveErrorMessage } from '../utils';

export function LoginLogDeleteDialog() {
  const { deleteTarget, setDeleteTarget } = useLoginLogManagementStore();
  const refresh = useLoginLogManagementRefresh();
  const { beginMutation, endMutation } =
    useLoginLogManagementMutationCounter();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => removeLoginLog(id),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('登录日志已删除');
      setDeleteTarget(null);
      refresh();
    },
    onError: (error) => {
      toast.error(
        resolveErrorMessage(error, '删除登录日志失败，请稍后再试'),
      );
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
      title="删除登录日志"
      description={
        deleteTarget
          ? `确定删除账号「${deleteTarget.userName || '未命名'}」的登录日志吗？`
          : '确定要删除该登录日志吗？'
      }
      loading={deleteMutation.isPending}
      onConfirm={() => {
        if (deleteTarget) {
          deleteMutation.mutate(deleteTarget.infoId);
        }
      }}
    />
  );
}
