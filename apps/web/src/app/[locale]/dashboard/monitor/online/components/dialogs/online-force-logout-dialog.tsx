'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('OnlineUserManagement');
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
        throw new Error(t('errors.missingIdentifier'));
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
      toast.success(t('toast.forceSuccess'));
      closeForceDialog();
      void queryClient.invalidateQueries({
        queryKey: ONLINE_USERS_QUERY_KEY,
      });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : t('toast.forceError');
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
      title={t('dialogs.force.title')}
      description={
        forceDialog.open
          ? t('dialogs.force.description.target', {
              name: forceDialog.user.userName || t('detail.unnamed'),
            })
          : t('dialogs.force.description.generic')
      }
      confirmLabel={t('dialogs.force.confirm')}
      loading={mutation.isPending}
      onConfirm={handleConfirm}
    />
  );
}
