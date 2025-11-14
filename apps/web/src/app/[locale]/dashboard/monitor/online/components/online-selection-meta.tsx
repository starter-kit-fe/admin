'use client';

import { useOnlinePermissionFlags } from '../hooks';
import { useOnlineUserManagementStore } from '../store';

export function OnlineUserSelectionMeta() {
  const { selectedUsers } = useOnlineUserManagementStore();
  const { canBatchLogout } = useOnlinePermissionFlags();

  if (!canBatchLogout || selectedUsers.length === 0) {
    return null;
  }

  return (
    <div className="text-sm text-muted-foreground">
      已选择 {selectedUsers.length} 名用户，可执行批量强退。
    </div>
  );
}
