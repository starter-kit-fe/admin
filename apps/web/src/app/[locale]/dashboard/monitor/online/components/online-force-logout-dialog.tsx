'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '../../../system/user/components/delete-confirm-dialog';
import { forceLogoutOnlineUser } from '../api';
import { ONLINE_USERS_QUERY_KEY } from '../constants';
import {
  useOnlineUserManagementMutationCounter,
  useOnlineUserManagementStore,
} from '../store';
import {
  getOnlineUserRowId,
  resolveOnlineUserIdentifier,
} from '../utils';

export function OnlineUserForceLogoutDialog() {
  const {
    forceDialog,
    closeForceDialog,
    setPendingForceRowId,
  } = useOnlineUserManagementStore();
  const queryClient = useQueryClient();
  const { beginMutation, endMutation } =
    useOnlineUserManagementMutationCounter();
  const tDialogs = useTranslations('OnlineUserManagement.dialogs.force');
  const tToast = useTranslations('OnlineUserManagement.toast');
  const tErrors = useTranslations('OnlineUserManagement.errors');
  const tDetail = useTranslations('OnlineUserManagement.detail');

  const mutation = useMutation({
    mutationFn: async () => {
      if (!forceDialog.open) {
        return;
      }
      const identifier = resolveOnlineUserIdentifier(forceDialog.user);
      if (!identifier) {
        throw new Error(tErrors('missingIdentifier'));
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
      toast.success(tToast('forceSuccess'));
      closeForceDialog();
      void queryClient.invalidateQueries({
        queryKey: ONLINE_USERS_QUERY_KEY,
      });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : tToast('forceError');
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
      title={tDialogs('title')}
      description={
        forceDialog.open
          ? tDialogs('description.target', {
              name: forceDialog.user.userName || tDetail('unnamed'),
            })
          : tDialogs('description.generic')
      }
      confirmLabel={tDialogs('confirm')}
      loading={mutation.isPending}
      onConfirm={handleConfirm}
    />
  );
}
