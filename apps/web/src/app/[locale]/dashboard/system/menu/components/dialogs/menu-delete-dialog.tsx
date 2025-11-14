'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '@/app/dashboard/system/user/components/delete-confirm-dialog';
import { removeMenu } from '@/app/dashboard/system/menu/api';
import {
  useMenuManagementMutationCounter,
  useMenuManagementRefresh,
  useMenuManagementStore,
} from '@/app/dashboard/system/menu/store';

export function MenuDeleteDialog() {
  const { deleteTarget, setDeleteTarget } = useMenuManagementStore();
  const refresh = useMenuManagementRefresh();
  const { beginMutation, endMutation } = useMenuManagementMutationCounter();

  const deleteMutation = useMutation({
    mutationFn: (menuId: number) => removeMenu(menuId),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('菜单已删除');
      setDeleteTarget(null);
      refresh();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : '删除菜单失败，请稍后再试';
      toast.error(message);
    },
    onSettled: () => {
      endMutation();
    },
  });

  return (
    <DeleteConfirmDialog
      open={deleteTarget !== null}
      title="删除菜单"
      description={
        deleteTarget
          ? `确定要删除菜单「${deleteTarget.menuName}」吗？如有子菜单将同时删除。`
          : '确认删除所选菜单吗？'
      }
      loading={deleteMutation.isPending}
      onOpenChange={(open) => {
        if (!open) {
          setDeleteTarget(null);
        }
      }}
      onConfirm={() => {
        if (deleteTarget) {
          deleteMutation.mutate(deleteTarget.menuId);
        }
      }}
    />
  );
}
