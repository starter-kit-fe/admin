'use client';

import {
  useConfigDeleteState,
  useConfigManagementMutationCounter,
  useConfigManagementRefresh,
} from '@/app/dashboard/system/config/store';
import { DeleteConfirmDialog } from '@/app/dashboard/system/user/components/delete-confirm-dialog';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { removeConfig } from '../../api';
import { resolveErrorMessage } from '../../utils';
import { useTranslations } from 'next-intl';

export function ConfigDeleteDialog() {
  const t = useTranslations('ConfigManagement');
  const { deleteTarget, setDeleteTarget } = useConfigDeleteState();
  const refresh = useConfigManagementRefresh();
  const { beginMutation, endMutation } = useConfigManagementMutationCounter();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => removeConfig(id),
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
          ? t('dialogs.deleteMessage', { name: deleteTarget.configName })
          : t('dialogs.deleteFallback')
      }
      loading={deleteMutation.isPending}
      onConfirm={() => {
        if (deleteTarget) {
          deleteMutation.mutate(deleteTarget.id);
        }
      }}
    />
  );
}
