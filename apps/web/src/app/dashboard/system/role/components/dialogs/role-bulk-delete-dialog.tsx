'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '@/app/dashboard/system/user/components/delete-confirm-dialog';
import { removeRole } from '../../api';
import {
  useRoleManagementMutationCounter,
  useRoleManagementRefresh,
  useRoleManagementStore,
} from '@/app/dashboard/system/role/store';

export function RoleBulkDeleteDialog() {
  const {
    bulkDeleteOpen,
    setBulkDeleteOpen,
    selectedIds,
    clearSelectedIds,
  } = useRoleManagementStore();
  const refresh = useRoleManagementRefresh();
  const { beginMutation, endMutation } = useRoleManagementMutationCounter();

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => removeRole(id)));
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
      title="批量删除角色"
      description={
        selectedCount > 0
          ? `将删除选中的 ${selectedCount} 个角色，操作不可恢复。`
          : '确认删除所选角色吗？'
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
