'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { DeleteConfirmDialog } from '@/app/dashboard/system/user/components/delete-confirm-dialog';

import { removeLoginLog } from '../../api';
import {
  useLoginLogManagementMutationCounter,
  useLoginLogManagementRefresh,
  useLoginLogManagementStore,
} from '../../store';
import { resolveErrorMessage } from '../../utils';

export function LoginLogDeleteDialog() {
  const { deleteTarget, setDeleteTarget } = useLoginLogManagementStore();
  const refresh = useLoginLogManagementRefresh();
  const { beginMutation, endMutation } =
    useLoginLogManagementMutationCounter();
  const t = useTranslations('LoginLogManagement');

  const deleteMutation = useMutation({
    mutationFn: (id: number) => removeLoginLog(id),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(t('toast.deleteSuccess'));
      setDeleteTarget(null);
      refresh();
    },
    onError: (error) => {
      toast.error(
        resolveErrorMessage(error, t('toast.deleteError')),
      );
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
          ? t('dialogs.deleteDescription', {
              name: deleteTarget.userName || t('dialogs.deleteUnnamed'),
            })
          : t('dialogs.deleteFallback')
      }
      loading={deleteMutation.isPending}
      onConfirm={() => {
        if (deleteTarget) {
          deleteMutation.mutate(deleteTarget.infoId);
        }
      }}
    />
  );
}
