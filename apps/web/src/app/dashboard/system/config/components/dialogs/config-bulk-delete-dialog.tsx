'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '@/app/dashboard/system/user/components/delete-confirm-dialog';
import { removeConfig } from '../../api';
import {
  useConfigManagementMutationCounter,
  useConfigManagementRefresh,
  useConfigManagementStore,
} from '@/app/dashboard/system/config/store';
import { resolveErrorMessage } from '../../utils';

export function ConfigBulkDeleteDialog() {
  const {
    bulkDeleteOpen,
    setBulkDeleteOpen,
    selectedIds,
    clearSelectedIds,
  } = useConfigManagementStore();
  const refresh = useConfigManagementRefresh();
  const { beginMutation, endMutation } = useConfigManagementMutationCounter();

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => removeConfig(id)));
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
      title="批量删除参数"
      description={
        selectedCount > 0
          ? `将删除选中的 ${selectedCount} 个参数，操作不可恢复。`
          : '确认删除所选参数吗？'
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
