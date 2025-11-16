'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
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
  const tDialogs = useTranslations('OnlineUserManagement.dialogs.batch');
  const tToast = useTranslations('OnlineUserManagement.toast');
  const tErrors = useTranslations('OnlineUserManagement.errors');

  const mutation = useMutation({
    mutationFn: async () => {
      const { ids, skipped } = extractOnlineUserIdentifiers(selectedUsers);
      if (ids.length === 0) {
        throw new Error(tErrors('missingBatch'));
      }
      await batchForceLogoutOnlineUsers(ids);
      return { count: ids.length, skipped };
    },
    onMutate: () => {
      beginMutation();
    },
    onSuccess: (result) => {
      toast.success(tToast('batchSuccess', { count: result.count }));
      if (result.skipped > 0) {
        toast.warning(tToast('batchSkipped', { count: result.skipped }));
      }
      clearSelectedUsers();
      setBatchDialogOpen(false);
      void queryClient.invalidateQueries({
        queryKey: ONLINE_USERS_QUERY_KEY,
      });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : tToast('batchError');
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
      title={tDialogs('title')}
      description={
        selectedCount > 0
          ? tDialogs('description.selected', { count: selectedCount })
          : tDialogs('description.empty')
      }
      confirmLabel={tDialogs('confirm')}
      loading={mutation.isPending}
      onConfirm={handleConfirm}
    />
  );
}
