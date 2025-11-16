'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

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
  const tDialogs = useTranslations('RoleManagement.dialogs');
  const tToast = useTranslations('RoleManagement.toast');

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => removeRole(id)));
    },
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(tToast('bulkDeleteSuccess'));
      setBulkDeleteOpen(false);
      clearSelectedIds();
      refresh();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : tToast('bulkDeleteError');
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
      title={tDialogs('bulkDeleteTitle')}
      description={
        selectedCount > 0
          ? tDialogs('bulkDeleteSelected', { count: selectedCount })
          : tToast('bulkDeleteEmpty')
      }
      confirmLabel={tDialogs('bulkDeleteConfirm')}
      cancelLabel={tDialogs('bulkDeleteCancel')}
      loading={bulkDeleteMutation.isPending}
      onConfirm={() => {
        if (selectedCount > 0) {
          bulkDeleteMutation.mutate(Array.from(selectedIds));
        }
      }}
    />
  );
}
