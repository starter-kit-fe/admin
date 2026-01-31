'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { removeUser } from '../../api';
import {
  useUserManagementMutationCounter,
  useUserManagementRefresh,
  useUserManagementStore,
} from '../../store';
import { DeleteConfirmDialog } from '../delete-confirm-dialog';

export function UserDeleteDialog() {
  const { deleteTarget, setDeleteTarget } = useUserManagementStore();
  const refresh = useUserManagementRefresh();
  const { beginMutation, endMutation } = useUserManagementMutationCounter();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => removeUser(id),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('用户已删除');
      setDeleteTarget(null);
      refresh();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : '删除用户失败，请稍后再试';
      toast.error(message);
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
      title="删除用户"
      description={
        deleteTarget
          ? `确定要删除用户「${deleteTarget.nickName || deleteTarget.userName}」吗？该操作无法撤销。`
          : '确认删除所选用户吗？'
      }
      loading={deleteMutation.isPending}
      onConfirm={() => {
        if (deleteTarget) {
          deleteMutation.mutate(deleteTarget.id);
        }
      }}
    />
  );
}
