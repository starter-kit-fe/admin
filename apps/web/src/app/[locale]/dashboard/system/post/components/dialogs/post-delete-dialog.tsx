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

export function PostDeleteDialog() {
  const { deleteTarget, setDeleteTarget } = usePostManagementStore();
  const refresh = usePostManagementRefresh();
  const { beginMutation, endMutation } = usePostManagementMutationCounter();
  const tDelete = useTranslations('PostManagement.delete');
  const tToast = useTranslations('PostManagement.toast');

  const deleteMutation = useMutation({
    mutationFn: (postId: number) => removePost(postId),
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
      title={tDelete('single.title')}
      description={
        deleteTarget
          ? tDelete('single.description', {
              name: deleteTarget.postName ?? '',
            })
          : tDelete('single.fallback')
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
