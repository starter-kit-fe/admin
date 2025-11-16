'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { DeleteConfirmDialog } from '@/app/dashboard/system/user/components/delete-confirm-dialog';
import { removeMenu } from '@/app/dashboard/system/menu/api';
import {
  useMenuManagementMutationCounter,
  useMenuManagementRefresh,
  useMenuManagementStore,
} from '@/app/dashboard/system/menu/store';

export function MenuDeleteDialog() {
  const { deleteTarget, setDeleteTarget } = useMenuManagementStore();
  const refresh = useMenuManagementRefresh();
  const { beginMutation, endMutation } = useMenuManagementMutationCounter();
  const tDialogs = useTranslations('MenuManagement.dialogs');
  const tToast = useTranslations('MenuManagement.toast');

  const deleteMutation = useMutation({
    mutationFn: (menuId: number) => removeMenu(menuId),
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
      title={tDialogs('deleteTitle')}
      description={
        deleteTarget
          ? tDialogs('deleteMessage', { name: deleteTarget.menuName })
          : tDialogs('deleteFallback')
      }
      loading={deleteMutation.isPending}
      onOpenChange={(open) => {
        if (!open) {
          setDeleteTarget(null);
        }
      }}
      onConfirm={() => {
        if (deleteTarget) {
          deleteMutation.mutate(deleteTarget.menuId);
        }
      }}
    />
  );
}
