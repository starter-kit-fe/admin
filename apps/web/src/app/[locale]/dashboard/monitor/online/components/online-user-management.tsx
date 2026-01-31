'use client';

import { OnlineUserBatchLogoutDialog } from './dialogs/online-batch-logout-dialog';
import { OnlineUserDetailDialog } from './dialogs/online-detail-dialog';
import { OnlineUserForceLogoutDialog } from './dialogs/online-force-logout-dialog';
import { OnlineUserManagementHeader } from './layout/online-management-header';
import { OnlineUserDataSection } from './sections/online-data-section';
import { OnlineUserFiltersSection } from './sections/online-filters-section';
import { useOnlinePermissionFlags } from '../hooks';

export function OnlineUserManagement() {
  const { canBatchLogout, canForceLogout, canQuery } =
    useOnlinePermissionFlags();

  return (
    <div className="mx-auto flex w-full flex-col gap-6 sm:gap-6">
      <OnlineUserManagementHeader />
      <OnlineUserFiltersSection />
      <OnlineUserDataSection />
      {canQuery ? <OnlineUserDetailDialog /> : null}
      {canForceLogout ? <OnlineUserForceLogoutDialog /> : null}
      {canBatchLogout ? <OnlineUserBatchLogoutDialog /> : null}
    </div>
  );
}
