'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '../../user/components/delete-confirm-dialog';
import { removePost } from '../api';
import {
  usePostManagementMutationCounter,
  usePostManagementRefresh,
  usePostManagementStore,
} from '@/app/dashboard/system/post/store';
import { resolveErrorMessage } from '../utils';

export function PostBulkDeleteDialog() {
  const {
    bulkDeleteOpen,
    setBulkDeleteOpen,
    selectedIds,
    clearSelectedIds,
  } = usePostManagementStore();
  const refresh = usePostManagementRefresh();
  const { beginMutation, endMutation } = usePostManagementMutationCounter();

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => removePost(id)));
    },
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('批量删除成功');
      setBulkDeleteOpen(false);
      clearSelectedIds();
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '批量删除失败，请稍后再试'));
    },
    onSettled: () => {
      endMutation();
    },
  });

  const selectedCount = selectedIds.size;

  return (
    <DeleteConfirmDialog
      open={bulkDeleteOpen}
      onOpenChange={setBulkDeleteOpen}
      title="批量删除岗位"
      description={
        selectedCount > 0
          ? `将删除选中的 ${selectedCount} 个岗位，操作不可恢复。`
          : '确认删除所选岗位吗？'
      }
      confirmLabel="批量删除"
      loading={bulkDeleteMutation.isPending}
      onConfirm={() => {
        if (selectedCount > 0) {
          bulkDeleteMutation.mutate(Array.from(selectedIds));
        }
      }}
    />
  );
}
