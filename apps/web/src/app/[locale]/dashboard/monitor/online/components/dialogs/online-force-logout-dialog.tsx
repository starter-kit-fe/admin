'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '../../../../system/user/components/delete-confirm-dialog';
import { forceLogoutOnlineUser } from '../../api';
import { ONLINE_USERS_QUERY_KEY } from '../../constants';
import {
  useOnlineUserManagementMutationCounter,
  useOnlineUserManagementStore,
} from '../../store';
import {
  getOnlineUserRowId,
  resolveOnlineUserIdentifier,
} from '../../utils';

export function OnlineUserForceLogoutDialog() {
  const {
    forceDialog,
    closeForceDialog,
    setPendingForceRowId,
  } = useOnlineUserManagementStore();
  const queryClient = useQueryClient();
  const { beginMutation, endMutation } =
    useOnlineUserManagementMutationCounter();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!forceDialog.open) {
        return;
      }
      const identifier = resolveOnlineUserIdentifier(forceDialog.user);
      if (!identifier) {
        throw new Error('未找到用户会话标识，无法强制下线');
      }
      await forceLogoutOnlineUser(identifier);
    },
    onMutate: () => {
      if (!forceDialog.open) {
        return;
      }
      beginMutation();
      setPendingForceRowId(getOnlineUserRowId(forceDialog.user));
    },
    onSuccess: () => {
      toast.success('已强制下线该用户');
      closeForceDialog();
      void queryClient.invalidateQueries({
        queryKey: ONLINE_USERS_QUERY_KEY,
      });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : '操作失败，请稍后重试';
      toast.error(message);
    },
    onSettled: () => {
      endMutation();
      setPendingForceRowId(null);
    },
  });

  const handleConfirm = () => {
    if (!forceDialog.open || mutation.isPending) {
      return;
    }
    mutation.mutate();
  };

  return (
    <DeleteConfirmDialog
      open={forceDialog.open}
      onOpenChange={(open) => {
        if (!open) {
          closeForceDialog();
        }
      }}
      title="强制下线"
      description={
        forceDialog.open
          ? `确定要强制下线账号“${
              forceDialog.user.userName || '未命名'
            }”吗？`
          : '确定要强制下线该用户吗？'
      }
      confirmLabel="确认强退"
      loading={mutation.isPending}
      onConfirm={handleConfirm}
    />
  );
}
