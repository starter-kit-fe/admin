'use client';

import {
  useDepartmentDeleteState,
  useDepartmentManagementMutationCounter,
  useDepartmentManagementRefresh,
} from '@/app/dashboard/system/dept/store';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '../../../user/components/delete-confirm-dialog';
import { removeDepartment } from '../../api';
import { resolveErrorMessage } from '../../utils';

export function DepartmentDeleteDialog() {
  const { deleteTarget, setDeleteTarget } = useDepartmentDeleteState();
  const refresh = useDepartmentManagementRefresh();
  const { beginMutation, endMutation } =
    useDepartmentManagementMutationCounter();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => removeDepartment(id),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('删除部门成功');
      setDeleteTarget(null);
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '删除部门失败，请稍后再试'));
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
      title="删除部门"
      description={
        deleteTarget
          ? `确定要删除部门「${deleteTarget.deptName}」吗？将同时移除其所有子部门。`
          : '确认删除所选部门吗？'
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
