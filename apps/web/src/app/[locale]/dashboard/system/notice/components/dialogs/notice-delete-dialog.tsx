'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '@/app/dashboard/system/user/components/delete-confirm-dialog';
import { removeNotice } from '../../api';
import {
  useNoticeManagementMutationCounter,
  useNoticeManagementRefresh,
  useNoticeManagementStore,
} from '@/app/dashboard/system/notice/store';
import { resolveErrorMessage } from '../../utils';
import { useTranslations } from 'next-intl';

export function NoticeDeleteDialog() {
  const { deleteTarget, setDeleteTarget } = useNoticeManagementStore();
  const refresh = useNoticeManagementRefresh();
  const { beginMutation, endMutation } =
    useNoticeManagementMutationCounter();
  const tToast = useTranslations('NoticeManagement.toast');
  const tDialogs = useTranslations('NoticeManagement.dialogs');

  const deleteMutation = useMutation({
    mutationFn: (id: number) => removeNotice(id),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(tToast('deleteSuccess'));
      setDeleteTarget(null);
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, tToast('deleteError')));
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
      title={tDialogs('deleteTitle')}
      description={
        deleteTarget
          ? tDialogs('deleteMessage', { name: deleteTarget.noticeTitle })
          : tDialogs('deleteFallback')
      }
      loading={deleteMutation.isPending}
      onConfirm={() => {
        if (deleteTarget) {
          deleteMutation.mutate(deleteTarget.noticeId);
        }
      }}
    />
  );
}
