'use client';

import { OnlineUserBatchLogoutDialog } from './components/dialogs/online-batch-logout-dialog';
import { OnlineUserDetailDialog } from './components/dialogs/online-detail-dialog';
import { OnlineUserForceLogoutDialog } from './components/dialogs/online-force-logout-dialog';
import { OnlineUserManagementHeader } from './components/layout/online-management-header';
import { OnlineUserDataSection } from './components/sections/online-data-section';
import { OnlineUserFiltersSection } from './components/sections/online-filters-section';
import { useOnlinePermissionFlags } from './hooks';

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
