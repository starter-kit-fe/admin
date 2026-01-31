'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '@/app/dashboard/system/user/components/delete-confirm-dialog';
import { removeMenu } from '@/app/dashboard/system/menu/api';
import {
  useMenuManagementMutationCounter,
  useMenuManagementRefresh,
  useMenuManagementStore,
} from '@/app/dashboard/system/menu/store';
import { useTranslations } from 'next-intl';

export function MenuDeleteDialog() {
  const t = useTranslations('MenuManagement');
  const { deleteTarget, setDeleteTarget } = useMenuManagementStore();
  const refresh = useMenuManagementRefresh();
  const { beginMutation, endMutation } = useMenuManagementMutationCounter();

  const deleteMutation = useMutation({
    mutationFn: (menuId: number) => removeMenu(menuId),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(t('toast.deleteSuccess'));
      setDeleteTarget(null);
      refresh();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : t('toast.deleteError');
      toast.error(message);
    },
    onSettled: () => {
      endMutation();
    },
  });

  return (
    <DeleteConfirmDialog
      open={deleteTarget !== null}
      title={t('dialogs.deleteTitle')}
      description={
        deleteTarget
          ? t('dialogs.deleteMessage', { name: deleteTarget.menuName })
          : t('dialogs.deleteFallback')
      }
      loading={deleteMutation.isPending}
      onOpenChange={(open) => {
        if (!open) {
          setDeleteTarget(null);
        }
      }}
      onConfirm={() => {
        if (deleteTarget) {
          deleteMutation.mutate(deleteTarget.id);
        }
      }}
    />
  );
}
