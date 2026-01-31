'use client';

import { DeleteConfirmDialog } from '@/app/dashboard/system/user/components/delete-confirm-dialog';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { removeOperLog } from '../../api';
import {
  useOperLogManagementMutationCounter,
  useOperLogManagementRefresh,
  useOperLogManagementStore,
} from '../../store';
import { resolveErrorMessage } from '../../utils';

export function OperLogDeleteDialog() {
  const { deleteTarget, setDeleteTarget } = useOperLogManagementStore();
  const refresh = useOperLogManagementRefresh();
  const { beginMutation, endMutation } = useOperLogManagementMutationCounter();
  const t = useTranslations('OperLogManagement');

  const deleteMutation = useMutation({
    mutationFn: (id: number) => removeOperLog(id),
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
      title={t('delete.title')}
      description={
        deleteTarget
          ? t('delete.description', {
              title: deleteTarget.title || t('delete.untitled'),
            })
          : t('delete.fallback')
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
