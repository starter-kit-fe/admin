'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '../../../system/user/components/delete-confirm-dialog';
import { batchForceLogoutOnlineUsers } from '../api';
import { ONLINE_USERS_QUERY_KEY } from '../constants';
import {
  useOnlineUserManagementMutationCounter,
  useOnlineUserManagementStore,
} from '../store';
import { extractOnlineUserIdentifiers } from '../utils';

export function OnlineUserBatchLogoutDialog() {
  const {
    batchDialogOpen,
    setBatchDialogOpen,
    selectedUsers,
    clearSelectedUsers,
  } = useOnlineUserManagementStore();
  const queryClient = useQueryClient();
  const { beginMutation, endMutation } =
    useOnlineUserManagementMutationCounter();

  const mutation = useMutation({
    mutationFn: async () => {
      const { ids, skipped } = extractOnlineUserIdentifiers(selectedUsers);
      if (ids.length === 0) {
        throw new Error('未找到可用的会话，无法执行批量强退');
      }
      await batchForceLogoutOnlineUsers(ids);
      return { count: ids.length, skipped };
    },
    onMutate: () => {
      beginMutation();
    },
    onSuccess: (result) => {
      toast.success(`已强制下线 ${result.count} 名用户`);
      if (result.skipped > 0) {
        toast.warning(
          `另有 ${result.skipped} 名用户缺少会话标识，未能处理`,
        );
      }
      clearSelectedUsers();
      setBatchDialogOpen(false);
      void queryClient.invalidateQueries({
        queryKey: ONLINE_USERS_QUERY_KEY,
      });
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : '批量强退失败，请稍后重试';
      toast.error(message);
    },
    onSettled: () => {
      endMutation();
    },
  });

  const selectedCount = selectedUsers.length;

  const handleConfirm = () => {
    if (mutation.isPending || selectedCount === 0) {
      return;
    }
    mutation.mutate();
  };

  return (
    <DeleteConfirmDialog
      open={batchDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          setBatchDialogOpen(false);
        }
      }}
      title="批量强退"
      description={
        selectedCount > 0
          ? `确定要强制下线已选的 ${selectedCount} 名用户吗？`
          : '请选择至少一名用户后再尝试批量强退。'
      }
      confirmLabel="批量强退"
      loading={mutation.isPending}
      onConfirm={handleConfirm}
    />
  );
}
