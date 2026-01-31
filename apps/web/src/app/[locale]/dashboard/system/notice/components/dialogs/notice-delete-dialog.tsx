'use client';

import {
  useNoticeManagementMutationCounter,
  useNoticeManagementRefresh,
  useNoticeManagementStore,
} from '@/app/dashboard/system/notice/store';
import { DeleteConfirmDialog } from '@/app/dashboard/system/user/components/delete-confirm-dialog';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { removeNotice } from '../../api';
import { resolveErrorMessage } from '../../utils';
import { useTranslations } from 'next-intl';

export function NoticeDeleteDialog() {
  const t = useTranslations('NoticeManagement');
  const { deleteTarget, setDeleteTarget } = useNoticeManagementStore();
  const refresh = useNoticeManagementRefresh();
  const { beginMutation, endMutation } = useNoticeManagementMutationCounter();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => removeNotice(id),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(t('toast.deleteSuccess'));
      setDeleteTarget(null);
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, t('toast.deleteError')));
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
      title={t('dialogs.deleteTitle')}
      description={
        deleteTarget
          ? t('dialogs.deleteMessage', { name: deleteTarget.noticeTitle })
          : t('dialogs.deleteFallback')
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
