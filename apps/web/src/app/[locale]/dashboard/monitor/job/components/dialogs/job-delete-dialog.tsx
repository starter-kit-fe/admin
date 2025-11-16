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
  const { deleteTarget, setDeleteTarget } = useJobManagementStore();
  const refresh = useJobManagementRefresh();
  const { beginMutation, endMutation } = useJobManagementMutationCounter();
  const tDialogs = useTranslations('JobManagement.dialogs');
  const tToast = useTranslations('JobManagement.toast');

  const deleteMutation = useMutation({
    mutationFn: (jobId: number) => deleteJob(jobId),
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
          ? tDialogs('deleteDescription', {
              name: deleteTarget.jobName ?? '',
            })
          : tDialogs('deleteFallback')
      }
      loading={deleteMutation.isPending}
      onConfirm={() => {
        if (deleteTarget) {
          deleteMutation.mutate(deleteTarget.jobId);
        }
      }}
    />
  );
}
