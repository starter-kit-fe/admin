'use client';

import { OnlineUserBatchLogoutDialog } from './components/online-batch-logout-dialog';
import { OnlineUserDataSection } from './components/online-data-section';
import { OnlineUserFiltersSection } from './components/online-filters-section';
import { OnlineUserForceLogoutDialog } from './components/online-force-logout-dialog';
import { OnlineUserManagementHeader } from './components/online-management-header';
import { OnlineUserSelectionMeta } from './components/online-selection-meta';
import { useOnlinePermissionFlags } from './hooks';

export function OnlineUserManagement() {
  const { canBatchLogout, canForceLogout } = useOnlinePermissionFlags();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
      <OnlineUserManagementHeader />
      <section className="space-y-4 rounded-xl border border-border/50 bg-card p-4">
        <OnlineUserFiltersSection />
        <OnlineUserSelectionMeta />
      </section>
      <OnlineUserDataSection />
      {canForceLogout ? <OnlineUserForceLogoutDialog /> : null}
      {canBatchLogout ? <OnlineUserBatchLogoutDialog /> : null}
    </div>
  );
}
