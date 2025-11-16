'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '../../../user/components/delete-confirm-dialog';
import { removePost } from '../../api';
import {
  usePostManagementMutationCounter,
  usePostManagementRefresh,
  usePostManagementStore,
} from '@/app/dashboard/system/post/store';
import { resolveErrorMessage } from '../../utils';
import { useTranslations } from 'next-intl';

export function PostBulkDeleteDialog() {
  const {
    bulkDeleteOpen,
    setBulkDeleteOpen,
    selectedIds,
    clearSelectedIds,
  } = usePostManagementStore();
  const refresh = usePostManagementRefresh();
  const { beginMutation, endMutation } = usePostManagementMutationCounter();
  const tDelete = useTranslations('PostManagement.delete');
  const tToast = useTranslations('PostManagement.toast');

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => removePost(id)));
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
      toast.error(resolveErrorMessage(error, tToast('bulkDeleteError')));
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
      title={tDelete('bulk.title')}
      description={
        selectedCount > 0
          ? tDelete('bulk.description', { count: selectedCount })
          : tDelete('bulk.fallback')
      }
      confirmLabel={tDelete('bulk.confirm')}
      loading={bulkDeleteMutation.isPending}
      onConfirm={() => {
        if (selectedCount > 0) {
          bulkDeleteMutation.mutate(Array.from(selectedIds));
        }
      }}
    />
  );
}
