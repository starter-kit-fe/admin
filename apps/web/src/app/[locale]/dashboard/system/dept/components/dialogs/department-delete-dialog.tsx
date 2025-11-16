'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { DeleteConfirmDialog } from '../../../user/components/delete-confirm-dialog';
import { removeDepartment } from '../../api';
import {
  useDepartmentDeleteState,
  useDepartmentManagementMutationCounter,
  useDepartmentManagementRefresh,
} from '@/app/dashboard/system/dept/store';
import { resolveErrorMessage } from '../../utils';

export function DepartmentDeleteDialog() {
  const { deleteTarget, setDeleteTarget } = useDepartmentDeleteState();
  const refresh = useDepartmentManagementRefresh();
  const { beginMutation, endMutation } =
    useDepartmentManagementMutationCounter();
  const tToast = useTranslations('DepartmentManagement.toast');
  const tDelete = useTranslations('DepartmentManagement.delete');

  const deleteMutation = useMutation({
    mutationFn: (deptId: number) => removeDepartment(deptId),
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
          ? tDelete('description', { name: deleteTarget.deptName })
          : tDelete('fallback')
      }
      loading={deleteMutation.isPending}
      onConfirm={() => {
        if (deleteTarget) {
          deleteMutation.mutate(deleteTarget.deptId);
        }
      }}
    />
  );
}
