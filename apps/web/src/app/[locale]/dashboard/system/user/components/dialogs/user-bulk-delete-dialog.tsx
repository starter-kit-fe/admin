'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { DeleteConfirmDialog } from '../delete-confirm-dialog';
import { removeUser } from '../../api';
import {
  useUserManagementMutationCounter,
  useUserManagementRefresh,
  useUserManagementStore,
} from '../../store';

export function UserBulkDeleteDialog() {
  const {
    bulkDeleteOpen,
    setBulkDeleteOpen,
    selectedIds,
    clearSelectedIds,
  } = useUserManagementStore();
  const refresh = useUserManagementRefresh();
  const { beginMutation, endMutation } = useUserManagementMutationCounter();
  const tDialogs = useTranslations('UserManagement.dialogs');
  const tToast = useTranslations('UserManagement.toast');

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => removeUser(id)));
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
