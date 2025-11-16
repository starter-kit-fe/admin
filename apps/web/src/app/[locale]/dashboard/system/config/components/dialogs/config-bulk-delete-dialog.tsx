'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '@/app/dashboard/system/user/components/delete-confirm-dialog';
import { removeConfig } from '../../api';
import {
  useConfigBulkDeleteState,
  useConfigManagementMutationCounter,
  useConfigManagementRefresh,
  useConfigSelection,
} from '@/app/dashboard/system/config/store';
import { resolveErrorMessage } from '../../utils';
import { useTranslations } from 'next-intl';

export function ConfigBulkDeleteDialog() {
  const { bulkDeleteOpen, setBulkDeleteOpen } = useConfigBulkDeleteState();
  const { selectedIds, clearSelectedIds } = useConfigSelection();
  const refresh = useConfigManagementRefresh();
  const { beginMutation, endMutation } = useConfigManagementMutationCounter();
  const tToast = useTranslations('ConfigManagement.toast');
  const tDialogs = useTranslations('ConfigManagement.dialogs');

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => removeConfig(id)));
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
      toast.error(
        resolveErrorMessage(error, tToast('bulkDeleteError')),
      );
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
          : tDialogs('deleteFallback')
      }
      confirmLabel={tDialogs('bulkDeleteConfirm')}
      loading={bulkDeleteMutation.isPending}
      onConfirm={() => {
        if (selectedCount > 0) {
          bulkDeleteMutation.mutate(Array.from(selectedIds));
        }
      }}
    />
  );
}
