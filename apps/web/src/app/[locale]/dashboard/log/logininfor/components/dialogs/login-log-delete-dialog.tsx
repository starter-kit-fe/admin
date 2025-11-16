'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '@/app/dashboard/system/user/components/delete-confirm-dialog';

import { removeLoginLog } from '../../api';
import {
  useLoginLogManagementMutationCounter,
  useLoginLogManagementRefresh,
  useLoginLogManagementStore,
} from '../../store';
import { resolveErrorMessage } from '../../utils';
import { useTranslations } from 'next-intl';

export function LoginLogDeleteDialog() {
  const { deleteTarget, setDeleteTarget } = useLoginLogManagementStore();
  const refresh = useLoginLogManagementRefresh();
  const { beginMutation, endMutation } =
    useLoginLogManagementMutationCounter();
  const tDialogs = useTranslations('LoginLogManagement.dialogs');
  const tToast = useTranslations('LoginLogManagement.toast');

  const deleteMutation = useMutation({
    mutationFn: (id: number) => removeLoginLog(id),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(tToast('deleteSuccess'));
      setDeleteTarget(null);
      refresh();
    },
    onError: (error) => {
      toast.error(
        resolveErrorMessage(error, tToast('deleteError')),
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
      title={tDialogs('deleteTitle')}
      description={
        deleteTarget
          ? tDialogs('deleteDescription', {
              name: deleteTarget.userName || tDialogs('deleteUnnamed'),
            })
          : tDialogs('deleteFallback')
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
