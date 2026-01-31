'use client';

import { DeleteConfirmDialog } from '@/app/dashboard/system/user/components/delete-confirm-dialog';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

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

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteJob(id),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('任务已删除');
      setDeleteTarget(null);
      refresh();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : '删除任务失败，请稍后再试';
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
      title="删除定时任务"
      description={
        deleteTarget
          ? `确定要删除任务「${deleteTarget.jobName}」吗？`
          : '确定要删除该任务吗？'
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
