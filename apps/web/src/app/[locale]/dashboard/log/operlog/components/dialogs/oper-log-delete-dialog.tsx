'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '@/app/dashboard/system/user/components/delete-confirm-dialog';

import { removeOperLog } from '../../api';
import {
  useOperLogManagementMutationCounter,
  useOperLogManagementRefresh,
  useOperLogManagementStore,
} from '../../store';
import { resolveErrorMessage } from '../../utils';
import { useTranslations } from 'next-intl';

export function OperLogDeleteDialog() {
  const { deleteTarget, setDeleteTarget } = useOperLogManagementStore();
  const refresh = useOperLogManagementRefresh();
  const { beginMutation, endMutation } =
    useOperLogManagementMutationCounter();
  const tDelete = useTranslations('OperLogManagement.delete');
  const tToast = useTranslations('OperLogManagement.toast');

  const deleteMutation = useMutation({
    mutationFn: (id: number) => removeOperLog(id),
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
      title={tDelete('title')}
      description={
        deleteTarget
          ? tDelete('description', {
              title: deleteTarget.title?.trim() || tDelete('untitled'),
            })
          : tDelete('fallback')
      }
      loading={deleteMutation.isPending}
      onConfirm={() => {
        if (deleteTarget) {
          deleteMutation.mutate(deleteTarget.operId);
        }
      }}
    />
  );
}
