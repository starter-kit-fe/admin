'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '@/app/dashboard/system/user/components/delete-confirm-dialog';

import { removeNotice } from '../../api';
import {
  useNoticeManagementMutationCounter,
  useNoticeManagementRefresh,
  useNoticeManagementStore,
} from '../../store';
import { resolveErrorMessage } from '../../utils';
import { useTranslations } from 'next-intl';

export function NoticeBulkDeleteDialog() {
  const {
    bulkDeleteOpen,
    setBulkDeleteOpen,
    selectedIds,
    clearSelectedIds,
  } = useNoticeManagementStore();
  const refresh = useNoticeManagementRefresh();
  const { beginMutation, endMutation } = useNoticeManagementMutationCounter();
  const tToast = useTranslations('NoticeManagement.toast');
  const tDialogs = useTranslations('NoticeManagement.dialogs');

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => removeNotice(id)));
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
