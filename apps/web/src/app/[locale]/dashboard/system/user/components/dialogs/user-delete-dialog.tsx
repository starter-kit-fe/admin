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

export function UserDeleteDialog() {
  const { deleteTarget, setDeleteTarget } = useUserManagementStore();
  const refresh = useUserManagementRefresh();
  const { beginMutation, endMutation } = useUserManagementMutationCounter();
  const tDialogs = useTranslations('UserManagement.dialogs');
  const tToast = useTranslations('UserManagement.toast');

  const deleteMutation = useMutation({
    mutationFn: (userId: number) => removeUser(userId),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(tToast('deleteSuccess'));
      setDeleteTarget(null);
      refresh();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : tToast('deleteError');
      toast.error(message);
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
          ? tDialogs('deleteMessage', {
              name: deleteTarget.nickName || deleteTarget.userName,
            })
          : tDialogs('deleteMessage', { name: '' })
      }
      confirmLabel={tDialogs('deleteTitle')}
      loading={deleteMutation.isPending}
      onConfirm={() => {
        if (deleteTarget) {
          deleteMutation.mutate(deleteTarget.userId);
        }
      }}
    />
  );
}
