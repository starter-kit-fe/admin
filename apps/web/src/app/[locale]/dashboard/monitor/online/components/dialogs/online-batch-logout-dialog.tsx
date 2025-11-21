'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { DeleteConfirmDialog } from '../../../../system/user/components/delete-confirm-dialog';
import { batchForceLogoutOnlineUsers } from '../../api';
import { ONLINE_USERS_QUERY_KEY } from '../../constants';
import {
  useOnlineUserManagementMutationCounter,
  useOnlineUserManagementStore,
} from '../../store';
import { extractOnlineUserIdentifiers } from '../../utils';

export function OnlineUserBatchLogoutDialog() {
  const t = useTranslations('OnlineUserManagement');
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
        throw new Error(t('errors.missingBatch'));
      }
      await batchForceLogoutOnlineUsers(ids);
      return { count: ids.length, skipped };
    },
    onMutate: () => {
      beginMutation();
    },
    onSuccess: (result) => {
      toast.success(t('toast.batchSuccess', { count: result.count }));
      if (result.skipped > 0) {
        toast.warning(
          t('toast.batchSkipped', { count: result.skipped }),
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
        error instanceof Error ? error.message : t('toast.batchError');
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
      title={t('dialogs.batch.title')}
      description={
        selectedCount > 0
          ? t('dialogs.batch.description.selected', {
              count: selectedCount,
            })
          : t('dialogs.batch.description.empty')
      }
      confirmLabel={t('dialogs.batch.confirm')}
      loading={mutation.isPending}
      onConfirm={handleConfirm}
    />
  );
}
