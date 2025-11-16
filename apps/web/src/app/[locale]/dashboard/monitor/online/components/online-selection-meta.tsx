'use client';

import { useTranslations } from 'next-intl';

import { useOnlinePermissionFlags } from '../hooks';
import { useOnlineUserManagementStore } from '../store';

export function OnlineUserSelectionMeta() {
  const { selectedUsers } = useOnlineUserManagementStore();
  const { canBatchLogout } = useOnlinePermissionFlags();
  const t = useTranslations('OnlineUserManagement.selection');

  if (!canBatchLogout || selectedUsers.length === 0) {
    return null;
  }

  return (
    <div className="text-sm text-muted-foreground">
      {t('summary', { count: selectedUsers.length })}
    </div>
  );
}
