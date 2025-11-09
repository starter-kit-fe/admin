'use client';

import { useOnlineUserManagementStore } from '../store';

export function OnlineUserSelectionMeta() {
  const { selectedUsers } = useOnlineUserManagementStore();

  if (selectedUsers.length === 0) {
    return null;
  }

  return (
    <div className="text-sm text-muted-foreground">
      已选择 {selectedUsers.length} 名用户，可执行批量强退。
    </div>
  );
}
