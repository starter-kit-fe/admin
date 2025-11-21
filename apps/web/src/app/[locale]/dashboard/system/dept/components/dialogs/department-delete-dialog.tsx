'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '../../../user/components/delete-confirm-dialog';
import { removeDepartment } from '../../api';
import {
  useDepartmentDeleteState,
  useDepartmentManagementMutationCounter,
  useDepartmentManagementRefresh,
} from '@/app/dashboard/system/dept/store';
import { resolveErrorMessage } from '../../utils';
import { useTranslations } from 'next-intl';

export function DepartmentDeleteDialog() {
  const t = useTranslations('DepartmentManagement');
  const { deleteTarget, setDeleteTarget } = useDepartmentDeleteState();
  const refresh = useDepartmentManagementRefresh();
  const { beginMutation, endMutation } =
    useDepartmentManagementMutationCounter();

  const deleteMutation = useMutation({
    mutationFn: (deptId: number) => removeDepartment(deptId),
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
          ? t('delete.description', { name: deleteTarget.deptName })
          : t('delete.fallback')
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
