'use client';

import { DeleteConfirmDialog } from '@/app/dashboard/system/user/components/delete-confirm-dialog';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { deleteJob } from '../../api';
import {
  useJobManagementMutationCounter,
  useJobManagementRefresh,
  useJobManagementStore,
} from '../../store';

export function JobDeleteDialog() {
  const t = useTranslations('JobManagement');
  const { deleteTarget, setDeleteTarget } = useJobManagementStore();
  const refresh = useJobManagementRefresh();
  const { beginMutation, endMutation } = useJobManagementMutationCounter();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteJob(id),
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
      onOpenChange={(open) => {
        if (!open) {
          setDeleteTarget(null);
        }
      }}
      title={t('dialogs.deleteTitle')}
      description={
        deleteTarget
          ? t('dialogs.deleteDescription', { name: deleteTarget.jobName })
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
