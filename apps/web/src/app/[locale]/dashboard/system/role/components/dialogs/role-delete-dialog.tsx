'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { DeleteConfirmDialog } from '@/app/dashboard/system/user/components/delete-confirm-dialog';
import { removeRole } from '../../api';
import {
  useRoleManagementMutationCounter,
  useRoleManagementRefresh,
  useRoleManagementStore,
} from '@/app/dashboard/system/role/store';

export function RoleDeleteDialog() {
  const { deleteTarget, setDeleteTarget } = useRoleManagementStore();
  const refresh = useRoleManagementRefresh();
  const { beginMutation, endMutation } = useRoleManagementMutationCounter();
  const tDialogs = useTranslations('RoleManagement.dialogs');
  const tToast = useTranslations('RoleManagement.toast');

  const deleteMutation = useMutation({
    mutationFn: (roleId: number) => removeRole(roleId),
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
          ? tDialogs('deleteMessage', { name: deleteTarget.roleName ?? '' })
          : tDialogs('deleteFallback')
      }
      confirmLabel={tDialogs('deleteTitle')}
      loading={deleteMutation.isPending}
      onConfirm={() => {
        if (deleteTarget) {
          deleteMutation.mutate(deleteTarget.roleId);
        }
      }}
    />
  );
}
