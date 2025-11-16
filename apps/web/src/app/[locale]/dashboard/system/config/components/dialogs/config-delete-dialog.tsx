'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '@/app/dashboard/system/user/components/delete-confirm-dialog';
import { removeConfig } from '../../api';
import {
  useConfigDeleteState,
  useConfigManagementMutationCounter,
  useConfigManagementRefresh,
} from '@/app/dashboard/system/config/store';
import { resolveErrorMessage } from '../../utils';
import { useTranslations } from 'next-intl';

export function ConfigDeleteDialog() {
  const { deleteTarget, setDeleteTarget } = useConfigDeleteState();
  const refresh = useConfigManagementRefresh();
  const { beginMutation, endMutation } =
    useConfigManagementMutationCounter();
  const tToast = useTranslations('ConfigManagement.toast');
  const tDialogs = useTranslations('ConfigManagement.dialogs');

  const deleteMutation = useMutation({
    mutationFn: (id: number) => removeConfig(id),
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
          ? tDialogs('deleteMessage', { name: deleteTarget.configName })
          : tDialogs('deleteFallback')
      }
      loading={deleteMutation.isPending}
      onConfirm={() => {
        if (deleteTarget) {
          deleteMutation.mutate(deleteTarget.configId);
        }
      }}
    />
  );
}
