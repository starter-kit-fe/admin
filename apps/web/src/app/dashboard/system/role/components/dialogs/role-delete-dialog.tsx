'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

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

  const deleteMutation = useMutation({
    mutationFn: (roleId: number) => removeRole(roleId),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('角色已删除');
      setDeleteTarget(null);
      refresh();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : '删除角色失败，请稍后再试';
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
      title="删除角色"
      description={
        deleteTarget
          ? `确定要删除角色「${deleteTarget.roleName}」吗？该操作无法撤销。`
          : '确认删除所选角色吗？'
      }
      loading={deleteMutation.isPending}
      onConfirm={() => {
        if (deleteTarget) {
          deleteMutation.mutate(deleteTarget.roleId);
        }
      }}
    />
  );
}
