'use client';

import {
  usePostManagementMutationCounter,
  usePostManagementRefresh,
  usePostManagementStore,
} from '@/app/dashboard/system/post/store';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '../../../user/components/delete-confirm-dialog';
import { removePost } from '../../api';
import { resolveErrorMessage } from '../../utils';

export function PostDeleteDialog() {
  const { deleteTarget, setDeleteTarget } = usePostManagementStore();
  const refresh = usePostManagementRefresh();
  const { beginMutation, endMutation } = usePostManagementMutationCounter();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => removePost(id),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('岗位已删除');
      setDeleteTarget(null);
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '删除岗位失败，请稍后再试'));
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
      title="删除岗位"
      description={
        deleteTarget
          ? `确定要删除岗位「${deleteTarget.postName}」吗？该操作无法撤销。`
          : '确认删除所选岗位吗？'
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
