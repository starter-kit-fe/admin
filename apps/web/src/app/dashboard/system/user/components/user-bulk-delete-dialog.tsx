'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { removeUser } from '../api';
import {
  useUserManagementMutationCounter,
  useUserManagementRefresh,
  useUserManagementStore,
} from '../store';

export function UserBulkDeleteDialog() {
  const {
    bulkDeleteOpen,
    setBulkDeleteOpen,
    selectedIds,
    clearSelectedIds,
  } = useUserManagementStore();
  const refresh = useUserManagementRefresh();
  const { beginMutation, endMutation } = useUserManagementMutationCounter();

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => removeUser(id)));
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
      const message =
        error instanceof Error ? error.message : '批量删除失败，请稍后再试';
      toast.error(message);
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
      title="批量删除用户"
      description={
        selectedCount > 0
          ? `将删除选中的 ${selectedCount} 个用户，操作不可恢复。`
          : '确认删除所选用户吗？'
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
