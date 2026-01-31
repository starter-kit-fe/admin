'use client';

import {
  usePostManagementMutationCounter,
  usePostManagementRefresh,
  usePostManagementStore,
} from '@/app/dashboard/system/post/store';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '../../../user/components/delete-confirm-dialog';
import { removePost } from '../../api';
import { resolveErrorMessage } from '../../utils';
import { useTranslations } from 'next-intl';

export function PostDeleteDialog() {
  const t = useTranslations('PostManagement');
  const { deleteTarget, setDeleteTarget } = usePostManagementStore();
  const refresh = usePostManagementRefresh();
  const { beginMutation, endMutation } = usePostManagementMutationCounter();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => removePost(id),
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
      title={t('delete.single.title')}
      description={
        deleteTarget
          ? t('delete.single.description', { name: deleteTarget.postName })
          : t('delete.single.fallback')
      }
      loading={deleteMutation.isPending}
      onConfirm={() => {
        if (deleteTarget) {
          deleteMutation.mutate(deleteTarget.postId);
        }
      }}
    />
  );
}
